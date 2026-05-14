import type { Matchup, Player, MatchResult } from '../types';

function strokesOnHole(holeStrokeIndex: number, diff: number): number {
  let strokes = 0;
  if (diff >= holeStrokeIndex) strokes++;
  if (diff >= holeStrokeIndex + 18) strokes++;
  return strokes;
}

function buildStatus(
  teamAHolesUp: number,
  lastHole: number,
  matchOver: boolean
): { status: string; winner: 'A' | 'B' | null; pointsA: number; pointsB: number } {
  const holesRemaining = 18 - lastHole;
  const isComplete = matchOver || lastHole === 18;

  if (lastHole === 0) return { status: 'Not started', winner: null, pointsA: 0, pointsB: 0 };

  if (isComplete) {
    if (teamAHolesUp > 0) {
      const s = holesRemaining > 0 ? `${teamAHolesUp}&${holesRemaining}` : `${teamAHolesUp} UP`;
      return { status: s, winner: 'A', pointsA: 1, pointsB: 0 };
    }
    if (teamAHolesUp < 0) {
      const up = Math.abs(teamAHolesUp);
      const s = holesRemaining > 0 ? `${up}&${holesRemaining}` : `${up} UP`;
      return { status: s, winner: 'B', pointsA: 0, pointsB: 1 };
    }
    return { status: 'Halved', winner: null, pointsA: 0.5, pointsB: 0.5 };
  }

  if (teamAHolesUp > 0) return { status: `${teamAHolesUp} UP`, winner: null, pointsA: 0, pointsB: 0 };
  if (teamAHolesUp < 0) return { status: `${Math.abs(teamAHolesUp)} DN`, winner: null, pointsA: 0, pointsB: 0 };
  return { status: 'AS', winner: null, pointsA: 0, pointsB: 0 };
}

export function calcMatchResult(
  matchup: Matchup,
  playerA: Player,
  playerB: Player,
  strokeIndexes: number[],
  playerA2?: Player,
  playerB2?: Player
): MatchResult {
  return matchup.format === 'fourball' && playerA2 && playerB2
    ? calcFourball(matchup, playerA, playerA2, playerB, playerB2, strokeIndexes)
    : calcSingles(matchup, playerA, playerB, strokeIndexes);
}

function calcSingles(
  matchup: Matchup,
  playerA: Player,
  playerB: Player,
  strokeIndexes: number[]
): MatchResult {
  // USGA match play: round each handicap to nearest whole number before diffing
  const rawDiff = Math.round(playerA.handicap) - Math.round(playerB.handicap);
  const sA = rawDiff > 0 ? rawDiff : 0;
  const sB = rawDiff < 0 ? -rawDiff : 0;

  const strokeHoles: Record<number, { a1: number; a2: number; b1: number; b2: number }> = {};
  for (let h = 1; h <= 18; h++) {
    const si = strokeIndexes[h - 1] ?? h;
    strokeHoles[h] = {
      a1: sA > 0 ? strokesOnHole(si, sA) : 0,
      a2: 0,
      b1: sB > 0 ? strokesOnHole(si, sB) : 0,
      b2: 0,
    };
  }

  let teamAHolesUp = 0;
  let lastHole = 0;
  let matchOver = false;

  for (let hole = 1; hole <= 18; hole++) {
    const s = matchup.scores[hole];
    if (s?.playerA == null || s?.playerB == null) break;

    const sh = strokeHoles[hole];
    const aNet = s.playerA - sh.a1;
    const bNet = s.playerB - sh.b1;

    if (aNet < bNet) teamAHolesUp++;
    else if (bNet < aNet) teamAHolesUp--;

    lastHole = hole;
    if (Math.abs(teamAHolesUp) > 18 - hole) { matchOver = true; break; }
  }

  const { status, winner, pointsA, pointsB } = buildStatus(teamAHolesUp, lastHole, matchOver);

  return {
    holesPlayed: lastHole,
    isComplete: matchOver || lastHole === 18 || matchup.status === 'complete',
    teamAHolesUp,
    status,
    winner,
    pointsA,
    pointsB,
    format: 'singles',
    strokes: { a1: sA, a2: 0, b1: sB, b2: 0 },
    strokeHoles,
  };
}

function calcFourball(
  matchup: Matchup,
  a1: Player,
  a2: Player,
  b1: Player,
  b2: Player,
  strokeIndexes: number[]
): MatchResult {
  // USGA match play: round each handicap before computing differences
  const rA1 = Math.round(a1.handicap);
  const rA2 = Math.round(a2.handicap);
  const rB1 = Math.round(b1.handicap);
  const rB2 = Math.round(b2.handicap);
  const minHcp = Math.min(rA1, rA2, rB1, rB2);
  const dA1 = rA1 - minHcp;
  const dA2 = rA2 - minHcp;
  const dB1 = rB1 - minHcp;
  const dB2 = rB2 - minHcp;

  const strokeHoles: Record<number, { a1: number; a2: number; b1: number; b2: number }> = {};
  for (let h = 1; h <= 18; h++) {
    const si = strokeIndexes[h - 1] ?? h;
    strokeHoles[h] = {
      a1: strokesOnHole(si, dA1),
      a2: strokesOnHole(si, dA2),
      b1: strokesOnHole(si, dB1),
      b2: strokesOnHole(si, dB2),
    };
  }

  let teamAHolesUp = 0;
  let lastHole = 0;
  let matchOver = false;

  for (let hole = 1; hole <= 18; hole++) {
    const s = matchup.scores[hole];
    const sh = strokeHoles[hole];

    const aScores: number[] = [];
    if (s?.playerA != null) aScores.push(s.playerA - sh.a1);
    if (s?.playerA2 != null) aScores.push(s.playerA2 - sh.a2);

    const bScores: number[] = [];
    if (s?.playerB != null) bScores.push(s.playerB - sh.b1);
    if (s?.playerB2 != null) bScores.push(s.playerB2 - sh.b2);

    // Hole is only scored when at least one player per team has entered
    if (aScores.length === 0 || bScores.length === 0) break;

    const aNet = Math.min(...aScores);
    const bNet = Math.min(...bScores);

    if (aNet < bNet) teamAHolesUp++;
    else if (bNet < aNet) teamAHolesUp--;

    lastHole = hole;
    if (Math.abs(teamAHolesUp) > 18 - hole) { matchOver = true; break; }
  }

  const { status, winner, pointsA, pointsB } = buildStatus(teamAHolesUp, lastHole, matchOver);

  return {
    holesPlayed: lastHole,
    isComplete: matchOver || lastHole === 18 || matchup.status === 'complete',
    teamAHolesUp,
    status,
    winner,
    pointsA,
    pointsB,
    format: 'fourball',
    strokes: { a1: dA1, a2: dA2, b1: dB1, b2: dB2 },
    strokeHoles,
  };
}

export function aggregateTeamPoints(results: MatchResult[]): { A: number; B: number } {
  return results.reduce(
    (acc, r) => ({ A: acc.A + r.pointsA, B: acc.B + r.pointsB }),
    { A: 0, B: 0 }
  );
}
