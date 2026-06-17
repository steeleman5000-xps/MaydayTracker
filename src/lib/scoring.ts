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
  if (matchup.manualResult) {
    const { pointsA, pointsB } = matchup.manualResult;
    const winner = pointsA > pointsB ? 'A' : pointsB > pointsA ? 'B' : null;
    const allocation = calcStrokeAllocation(matchup, playerA, playerB, strokeIndexes, playerA2, playerB2);
    return {
      holesPlayed: 18,
      isComplete: true,
      teamAHolesUp: pointsA > pointsB ? 1 : pointsB > pointsA ? -1 : 0,
      status: winner === null ? 'Manual Halved' : 'Manual Result',
      winner,
      pointsA,
      pointsB,
      format: matchup.format,
      strokes: allocation.strokes,
      strokeHoles: allocation.strokeHoles,
    };
  }

  return matchup.format === 'fourball' && playerA2 && playerB2
    ? calcFourball(matchup, playerA, playerA2, playerB, playerB2, strokeIndexes)
    : calcSingles(matchup, playerA, playerB, strokeIndexes);
}

export function calcStrokeAllocation(
  matchup: Matchup,
  playerA: Player,
  playerB: Player,
  strokeIndexes: number[],
  playerA2?: Player,
  playerB2?: Player
): Pick<MatchResult, 'strokes' | 'strokeHoles'> {
  if (matchup.format === 'fourball' && playerA2 && playerB2) {
    const rA1 = Math.round(playerA.handicap);
    const rA2 = Math.round(playerA2.handicap);
    const rB1 = Math.round(playerB.handicap);
    const rB2 = Math.round(playerB2.handicap);
    const minHcp = Math.min(rA1, rA2, rB1, rB2);
    const strokes = {
      a1: rA1 - minHcp,
      a2: rA2 - minHcp,
      b1: rB1 - minHcp,
      b2: rB2 - minHcp,
    };
    return { strokes, strokeHoles: buildStrokeHoles(strokes, strokeIndexes) };
  }

  const rawDiff = Math.round(playerA.handicap) - Math.round(playerB.handicap);
  const strokes = {
    a1: rawDiff > 0 ? rawDiff : 0,
    a2: 0,
    b1: rawDiff < 0 ? -rawDiff : 0,
    b2: 0,
  };
  return { strokes, strokeHoles: buildStrokeHoles(strokes, strokeIndexes) };
}

function buildStrokeHoles(
  strokes: { a1: number; a2: number; b1: number; b2: number },
  strokeIndexes: number[]
): Record<number, { a1: number; a2: number; b1: number; b2: number }> {
  const strokeHoles: Record<number, { a1: number; a2: number; b1: number; b2: number }> = {};
  for (let h = 1; h <= 18; h++) {
    const si = strokeIndexes[h - 1] ?? h;
    strokeHoles[h] = {
      a1: strokesOnHole(si, strokes.a1),
      a2: strokesOnHole(si, strokes.a2),
      b1: strokesOnHole(si, strokes.b1),
      b2: strokesOnHole(si, strokes.b2),
    };
  }
  return strokeHoles;
}

function calcSingles(
  matchup: Matchup,
  playerA: Player,
  playerB: Player,
  strokeIndexes: number[]
): MatchResult {
  // USGA match play: round each handicap to nearest whole number before diffing
  const { strokes, strokeHoles } = calcStrokeAllocation(matchup, playerA, playerB, strokeIndexes);

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
    strokes,
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
  const { strokes, strokeHoles } = calcStrokeAllocation(matchup, a1, b1, strokeIndexes, a2, b2);

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
    strokes,
    strokeHoles,
  };
}

export function aggregateTeamPoints(results: MatchResult[]): { A: number; B: number } {
  return results.reduce(
    (acc, r) => ({ A: acc.A + r.pointsA, B: acc.B + r.pointsB }),
    { A: 0, B: 0 }
  );
}
