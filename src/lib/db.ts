import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Player, Round, Matchup, AppConfig, HoleWager } from '../types';

// ── Config ──────────────────────────────────────────────────────────────────

export function subscribeConfig(cb: (cfg: AppConfig | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'config', 'settings'), (snap) => {
    cb(snap.exists() ? (snap.data() as AppConfig) : null);
  });
}

export async function saveConfig(cfg: AppConfig): Promise<void> {
  await setDoc(doc(db, 'config', 'settings'), cfg);
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
