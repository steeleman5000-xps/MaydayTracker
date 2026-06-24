import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
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

// ── Config ──────────────────────────────────────────────────────────────────

export function subscribeConfig(cb: (cfg: AppConfig | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'config', 'settings'), (snap) => {
    cb(snap.exists() ? (snap.data() as AppConfig) : null);
  });
}

export async function saveConfig(cfg: AppConfig): Promise<void> {
  await setDoc(doc(db, 'config', 'settings'), cfg);
}

// ── Trips ────────────────────────────────────────────────────────────────────

export function subscribeTrips(cb: (trips: Trip[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'trips'), orderBy('createdAt')),
    (snap) => cb(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Trip)
        .sort((a, b) => b.year - a.year || a.createdAt - b.createdAt)
    )
  );
}

export async function addTrip(t: Omit<Trip, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'trips'), t);
  return ref.id;
}

export async function updateTrip(id: string, t: Partial<Trip>): Promise<void> {
  await updateDoc(doc(db, 'trips', id), t);
}

export async function deleteTrip(id: string): Promise<void> {
  await deleteDoc(doc(db, 'trips', id));
}

// ── Players ──────────────────────────────────────────────────────────────────

export function subscribePlayers(cb: (players: Player[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'players'), orderBy('createdAt')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Player)
  ));
}

export async function addPlayer(p: Omit<Player, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'players'), p);
  return ref.id;
}

export async function updatePlayer(id: string, p: Partial<Player>): Promise<void> {
  await updateDoc(doc(db, 'players', id), p);
}

export async function deletePlayer(id: string): Promise<void> {
  await deleteDoc(doc(db, 'players', id));
}

// ── Rounds ────────────────────────────────────────────────────────────────────

export function subscribeRounds(cb: (rounds: Round[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'rounds'), orderBy('number')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Round)
  ));
}

export async function saveRound(round: Omit<Round, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'rounds'), round);
  return ref.id;
}

export async function updateRound(id: string, round: Partial<Round>): Promise<void> {
  await updateDoc(doc(db, 'rounds', id), round);
}

export async function deleteRound(id: string): Promise<void> {
  await deleteDoc(doc(db, 'rounds', id));
}

// ── Saved Courses ────────────────────────────────────────────────────────────

export function subscribeSavedCourses(cb: (courses: SavedCourse[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'savedCourses'), orderBy('clubName')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedCourse))
  );
}

export async function addSavedCourse(course: Omit<SavedCourse, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'savedCourses'), course);
  return ref.id;
}

export async function updateSavedCourse(id: string, course: Partial<SavedCourse>): Promise<void> {
  await updateDoc(doc(db, 'savedCourses', id), course);
}

export async function deleteSavedCourse(id: string): Promise<void> {
  await deleteDoc(doc(db, 'savedCourses', id));
}

// ── Solo Rounds ──────────────────────────────────────────────────────────────

export function subscribeSoloRounds(cb: (rounds: SoloRound[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'soloRounds'), orderBy('createdAt')),
    (snap) => cb(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as SoloRound)
        .sort((a, b) => b.createdAt - a.createdAt)
    )
  );
}

export async function addSoloRound(round: Omit<SoloRound, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'soloRounds'), round);
  return ref.id;
}

export async function updateSoloRound(id: string, round: Partial<SoloRound>): Promise<void> {
  await updateDoc(doc(db, 'soloRounds', id), round);
}

export async function deleteSoloRound(id: string): Promise<void> {
  await deleteDoc(doc(db, 'soloRounds', id));
}

export async function updateSoloHoleScore(
  roundId: string,
  hole: number,
  score: number | null
): Promise<void> {
  await updateDoc(doc(db, 'soloRounds', roundId), {
    [`scores.${hole}`]: score ?? deleteField(),
    status: 'active',
    updatedAt: Date.now(),
  });
}

// ── Itinerary ────────────────────────────────────────────────────────────────

export function subscribeTripEvents(cb: (events: TripEvent[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'tripEvents'), orderBy('date')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TripEvent))
  );
}

export async function addTripEvent(event: Omit<TripEvent, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'tripEvents'), event);
  return ref.id;
}

export async function updateTripEvent(id: string, event: Partial<TripEvent>): Promise<void> {
  await updateDoc(doc(db, 'tripEvents', id), event);
}

export async function deleteTripEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, 'tripEvents', id));
}

// ── Matchups ──────────────────────────────────────────────────────────────────

export function subscribeMatchups(cb: (matchups: Matchup[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'matchups'), orderBy('createdAt')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Matchup)
  ));
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
  const ref = await addDoc(collection(db, 'matchups'), m);
  return ref.id;
}

export async function updateMatchup(id: string, m: Partial<Matchup>): Promise<void> {
  await updateDoc(doc(db, 'matchups', id), m);
}

export async function deleteMatchup(id: string): Promise<void> {
  await deleteDoc(doc(db, 'matchups', id));
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
  await updateDoc(doc(db, 'matchups', matchupId), patch);
}

export async function setMatchupStatus(
  matchupId: string,
  status: Matchup['status']
): Promise<void> {
  await updateDoc(doc(db, 'matchups', matchupId), { status });
}

export async function saveHoleWager(
  matchupId: string,
  hole: number,
  wager: HoleWager
): Promise<void> {
  await updateDoc(doc(db, 'matchups', matchupId), { [`wagers.${hole}`]: wager });
}

export async function saveMatchWager(
  matchupId: string,
  wager: Wager
): Promise<void> {
  await updateDoc(doc(db, 'matchups', matchupId), { matchWager: wager });
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

  await updateDoc(doc(db, 'matchups', matchupId), {
    manualResult: cleanResult,
    status: 'complete',
  });
}
