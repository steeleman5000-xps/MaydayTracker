import {
  collection,
  doc,
  getDoc,
  deleteField,
  limit,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
  type WriteBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type {
  AuditEvent,
  Player,
  Round,
  Matchup,
  AppConfig,
  HoleWager,
  Trip,
  Wager,
  ManualResult,
  ManualPlayerTotals,
  TripEvent,
  SavedCourse,
  SoloRound,
} from '../types';

type CollectionName =
  | 'config'
  | 'trips'
  | 'players'
  | 'rounds'
  | 'savedCourses'
  | 'soloRounds'
  | 'tripEvents'
  | 'matchups';

type AuditPatch = Record<string, unknown>;

interface UpdateAuditOptions {
  auditPatch?: AuditPatch;
  deletedFieldPaths?: string[];
}

function subscribeCollection<T>(
  collectionName: string,
  cb: (items: T[]) => void,
  mapDoc: (docSnap: QueryDocumentSnapshot<DocumentData>) => T,
  sortField: string,
  sortDirection: 'asc' | 'desc' = 'asc',
  resultLimit?: number
): Unsubscribe {
  const constraints = resultLimit
    ? [orderBy(sortField, sortDirection), limit(resultLimit)]
    : [orderBy(sortField, sortDirection)];
  return onSnapshot(query(collection(db, collectionName), ...constraints), (snap) => {
    cb(snap.docs.map(mapDoc));
  });
}

function currentActor() {
  const user = auth.currentUser;
  return {
    uid: user?.uid ?? null,
    email: user?.email ?? null,
    displayName: user?.displayName ?? null,
    isAuthenticated: Boolean(user),
  };
}

function auditEventDoc() {
  return doc(collection(db, 'auditEvents'));
}

function cleanAuditValue(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(cleanAuditValue);
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = cleanAuditValue(child);
      if (cleaned !== undefined) result[key] = cleaned;
    }
    return result;
  }
  return String(value);
}

function cloneAuditObject(value: DocumentData | null): Record<string, unknown> | null {
  if (!value) return null;
  return cleanAuditValue(value) as Record<string, unknown>;
}

function setByPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.');
  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    const next = cursor[part];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  const cleaned = cleanAuditValue(value);
  if (cleaned !== undefined) cursor[parts[parts.length - 1]] = cleaned;
}

function deleteByPath(target: Record<string, unknown>, path: string) {
  const parts = path.split('.');
  let cursor: Record<string, unknown> | undefined = target;
  for (const part of parts.slice(0, -1)) {
    const next = cursor[part];
    if (!next || typeof next !== 'object' || Array.isArray(next)) return;
    cursor = next as Record<string, unknown>;
  }
  delete cursor[parts[parts.length - 1]];
}

function applyPatchForAudit(
  before: DocumentData | null,
  patch: AuditPatch,
  deletedFieldPaths: string[] = []
): Record<string, unknown> | null {
  if (!before) return null;
  const after = cloneAuditObject(before);
  if (!after) return null;
  for (const [fieldPath, value] of Object.entries(patch)) {
    if (deletedFieldPaths.includes(fieldPath)) {
      deleteByPath(after, fieldPath);
    } else {
      setByPath(after, fieldPath, value);
    }
  }
  return after;
}

async function writeAuditEvent(
  batch: WriteBatch,
  collectionName: CollectionName,
  documentId: string,
  action: AuditEvent['action'],
  before: DocumentData | null,
  after: unknown,
  patch?: AuditPatch
) {
  const changedFields = patch ? Object.keys(patch).sort() : [];
  batch.set(auditEventDoc(), {
    collectionName,
    documentId,
    documentPath: `${collectionName}/${documentId}`,
    action,
    changedFields,
    before: cleanAuditValue(before) ?? null,
    after: cleanAuditValue(after) ?? null,
    patch: patch ? cleanAuditValue(patch) : null,
    actor: currentActor(),
    createdAt: Date.now(),
    serverCreatedAt: serverTimestamp(),
    source: 'web-client',
  });
}

async function auditSet<T extends DocumentData>(
  collectionName: CollectionName,
  documentId: string,
  data: T
): Promise<void> {
  const ref = doc(db, collectionName, documentId);
  const beforeSnap = await getDoc(ref);
  const batch = writeBatch(db);
  batch.set(ref, data);
  await writeAuditEvent(
    batch,
    collectionName,
    documentId,
    beforeSnap.exists() ? 'set' : 'create',
    beforeSnap.exists() ? beforeSnap.data() : null,
    data,
    data
  );
  await batch.commit();
}

async function auditAdd<T extends DocumentData>(collectionName: CollectionName, data: T): Promise<string> {
  const ref = doc(collection(db, collectionName));
  const batch = writeBatch(db);
  batch.set(ref, data);
  await writeAuditEvent(batch, collectionName, ref.id, 'create', null, data, data);
  await batch.commit();
  return ref.id;
}

async function auditUpdate(
  collectionName: CollectionName,
  documentId: string,
  patch: DocumentData,
  options: UpdateAuditOptions = {}
): Promise<void> {
  const ref = doc(db, collectionName, documentId);
  const beforeSnap = await getDoc(ref);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;
  const auditPatch = options.auditPatch ?? patch;
  const after = applyPatchForAudit(before, auditPatch, options.deletedFieldPaths);
  const batch = writeBatch(db);
  batch.update(ref, patch);
  await writeAuditEvent(batch, collectionName, documentId, 'update', before, after, auditPatch);
  await batch.commit();
}

async function auditDelete(collectionName: CollectionName, documentId: string): Promise<void> {
  const ref = doc(db, collectionName, documentId);
  const beforeSnap = await getDoc(ref);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;
  const batch = writeBatch(db);
  batch.delete(ref);
  await writeAuditEvent(batch, collectionName, documentId, 'delete', before, null);
  await batch.commit();
}

// ── Config ──────────────────────────────────────────────────────────────────

export function subscribeConfig(cb: (cfg: AppConfig | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'config', 'settings'), (snap) => {
    cb(snap.exists() ? (snap.data() as AppConfig) : null);
  });
}

export async function saveConfig(cfg: AppConfig): Promise<void> {
  await auditSet('config', 'settings', cfg);
}

// ── Audit Events ────────────────────────────────────────────────────────────

export function subscribeAuditEvents(cb: (events: AuditEvent[]) => void): Unsubscribe {
  return subscribeCollection(
    'auditEvents',
    cb,
    (d) => ({ id: d.id, ...d.data() }) as AuditEvent,
    'createdAt',
    'desc',
    100
  );
}

// ── Trips ────────────────────────────────────────────────────────────────────

export function subscribeTrips(cb: (trips: Trip[]) => void): Unsubscribe {
  return subscribeCollection<Trip>(
    'trips',
    (trips) => cb(trips.sort((a, b) => b.year - a.year || a.createdAt - b.createdAt)),
    (d) => ({ id: d.id, ...d.data() }) as Trip,
    'createdAt'
  );
}

export async function addTrip(t: Omit<Trip, 'id'>): Promise<string> {
  return auditAdd('trips', t);
}

export async function updateTrip(id: string, t: Partial<Trip>): Promise<void> {
  await auditUpdate('trips', id, t);
}

export async function deleteTrip(id: string): Promise<void> {
  await auditDelete('trips', id);
}

// ── Players ──────────────────────────────────────────────────────────────────

export function subscribePlayers(cb: (players: Player[]) => void): Unsubscribe {
  return subscribeCollection('players', cb, (d) => ({ id: d.id, ...d.data() }) as Player, 'createdAt');
}

export async function addPlayer(p: Omit<Player, 'id'>): Promise<string> {
  return auditAdd('players', p);
}

export async function updatePlayer(id: string, p: Partial<Player>): Promise<void> {
  await auditUpdate('players', id, p);
}

export async function deletePlayer(id: string): Promise<void> {
  await auditDelete('players', id);
}

// ── Rounds ────────────────────────────────────────────────────────────────────

export function subscribeRounds(cb: (rounds: Round[]) => void): Unsubscribe {
  return subscribeCollection('rounds', cb, (d) => ({ id: d.id, ...d.data() }) as Round, 'number');
}

export async function saveRound(round: Omit<Round, 'id'>): Promise<string> {
  return auditAdd('rounds', round);
}

export async function updateRound(id: string, round: Partial<Round>): Promise<void> {
  await auditUpdate('rounds', id, round);
}

export async function deleteRound(id: string): Promise<void> {
  await auditDelete('rounds', id);
}

// ── Saved Courses ────────────────────────────────────────────────────────────

export function subscribeSavedCourses(cb: (courses: SavedCourse[]) => void): Unsubscribe {
  return subscribeCollection('savedCourses', cb, (d) => ({ id: d.id, ...d.data() }) as SavedCourse, 'clubName');
}

export async function addSavedCourse(course: Omit<SavedCourse, 'id'>): Promise<string> {
  return auditAdd('savedCourses', course);
}

export async function updateSavedCourse(id: string, course: Partial<SavedCourse>): Promise<void> {
  await auditUpdate('savedCourses', id, course);
}

export async function deleteSavedCourse(id: string): Promise<void> {
  await auditDelete('savedCourses', id);
}

// ── Solo Rounds ──────────────────────────────────────────────────────────────

export function subscribeSoloRounds(cb: (rounds: SoloRound[]) => void): Unsubscribe {
  return subscribeCollection<SoloRound>(
    'soloRounds',
    (rounds) => cb(rounds.sort((a, b) => b.createdAt - a.createdAt)),
    (d) => ({ id: d.id, ...d.data() }) as SoloRound,
    'createdAt'
  );
}

export async function addSoloRound(round: Omit<SoloRound, 'id'>): Promise<string> {
  return auditAdd('soloRounds', round);
}

export async function updateSoloRound(id: string, round: Partial<SoloRound>): Promise<void> {
  await auditUpdate('soloRounds', id, round);
}

export async function deleteSoloRound(id: string): Promise<void> {
  await auditDelete('soloRounds', id);
}

export async function updateSoloHoleScore(
  roundId: string,
  hole: number,
  score: number | null
): Promise<void> {
  const now = Date.now();
  const scoreField = `scores.${hole}`;
  await auditUpdate('soloRounds', roundId, {
    [scoreField]: score ?? deleteField(),
    status: 'active',
    updatedAt: now,
  }, {
    auditPatch: {
      [scoreField]: score,
      status: 'active',
      updatedAt: now,
    },
    deletedFieldPaths: score == null ? [scoreField] : [],
  });
}

// ── Itinerary ────────────────────────────────────────────────────────────────

export function subscribeTripEvents(cb: (events: TripEvent[]) => void): Unsubscribe {
  return subscribeCollection('tripEvents', cb, (d) => ({ id: d.id, ...d.data() }) as TripEvent, 'date');
}

export async function addTripEvent(event: Omit<TripEvent, 'id'>): Promise<string> {
  return auditAdd('tripEvents', event);
}

export async function updateTripEvent(id: string, event: Partial<TripEvent>): Promise<void> {
  await auditUpdate('tripEvents', id, event);
}

export async function deleteTripEvent(id: string): Promise<void> {
  await auditDelete('tripEvents', id);
}

// ── Matchups ──────────────────────────────────────────────────────────────────

export function subscribeMatchups(cb: (matchups: Matchup[]) => void): Unsubscribe {
  return subscribeCollection('matchups', cb, (d) => ({ id: d.id, ...d.data() }) as Matchup, 'createdAt');
}

export function subscribeMatchup(
  id: string,
  cb: (matchup: Matchup | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'matchups', id), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as Matchup) : null);
  });
}

export async function getMatchup(id: string): Promise<Matchup | null> {
  const snap = await getDoc(doc(db, 'matchups', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Matchup) : null;
}

export async function addMatchup(m: Omit<Matchup, 'id'>): Promise<string> {
  return auditAdd('matchups', m);
}

export async function updateMatchup(id: string, m: Partial<Matchup>): Promise<void> {
  await auditUpdate('matchups', id, m);
}

export async function deleteMatchup(id: string): Promise<void> {
  await auditDelete('matchups', id);
}

export type ScoreField = 'playerA' | 'playerB' | 'playerA2' | 'playerB2';

export async function updateHoleScore(
  matchupId: string,
  hole: number,
  updates: Partial<Record<ScoreField, number | null>>
): Promise<void> {
  const patch: Record<string, number | null> = {};
  for (const [field, val] of Object.entries(updates)) {
    patch[`scores.${hole}.${field}`] = val ?? null;
  }
  await auditUpdate('matchups', matchupId, patch);
}

export async function setMatchupStatus(
  matchupId: string,
  status: Matchup['status']
): Promise<void> {
  await auditUpdate('matchups', matchupId, { status });
}

export async function saveHoleWager(
  matchupId: string,
  hole: number,
  wager: HoleWager
): Promise<void> {
  await auditUpdate('matchups', matchupId, { [`wagers.${hole}`]: wager });
}

export async function saveMatchWager(
  matchupId: string,
  wager: Wager
): Promise<void> {
  await auditUpdate('matchups', matchupId, { matchWager: wager });
}

export async function saveManualResult(
  matchupId: string,
  manualResult: ManualResult
): Promise<void> {
  const cleanResult: ManualResult = {
    pointsA: manualResult.pointsA,
    pointsB: manualResult.pointsB,
    createdAt: manualResult.createdAt,
  };
  if (manualResult.teamAScore != null) cleanResult.teamAScore = manualResult.teamAScore;
  if (manualResult.teamBScore != null) cleanResult.teamBScore = manualResult.teamBScore;
  if (manualResult.playerTotals) {
    const playerTotals: ManualPlayerTotals = {};
    if (manualResult.playerTotals.playerA != null) playerTotals.playerA = manualResult.playerTotals.playerA;
    if (manualResult.playerTotals.playerA2 != null) playerTotals.playerA2 = manualResult.playerTotals.playerA2;
    if (manualResult.playerTotals.playerB != null) playerTotals.playerB = manualResult.playerTotals.playerB;
    if (manualResult.playerTotals.playerB2 != null) playerTotals.playerB2 = manualResult.playerTotals.playerB2;
    if (Object.keys(playerTotals).length > 0) cleanResult.playerTotals = playerTotals;
  }
  if (manualResult.note) cleanResult.note = manualResult.note;

  await auditUpdate('matchups', matchupId, {
    manualResult: cleanResult,
    status: 'complete',
  });
}
