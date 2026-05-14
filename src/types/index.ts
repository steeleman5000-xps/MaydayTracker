export type TeamId = 'A' | 'B';
export type MatchFormat = 'singles' | 'fourball';

export interface Player {
  id: string;
  name: string;
  teamId: TeamId;
  handicap: number;
  teebox?: string;
  createdAt: number;
}

export interface Round {
  id: string;
  number: number;
  courseName: string;
  // strokeIndexes[i] = stroke index rating for hole (i+1), values 1–18
  strokeIndexes: number[];
  createdAt: number;
}

export interface HoleScores {
  // Singles: playerA / playerB
  // Fourball: playerA = A player 1, playerA2 = A player 2, etc.
  playerA?: number;
  playerB?: number;
  playerA2?: number;
  playerB2?: number;
}

export type WagerType = 'money' | 'alcohol' | 'drugs' | 'sexual_favors';

export interface HoleWager {
  type: WagerType;
  amount: string; // dollar amount for money; free text for others
  createdAt: number;
}

export interface Matchup {
  id: string;
  roundId: string;
  format: MatchFormat;
  playerAId: string;    // singles: Team A; fourball: Team A player 1
  playerBId: string;    // singles: Team B; fourball: Team B player 1
  playerA2Id?: string;  // fourball: Team A player 2
  playerB2Id?: string;  // fourball: Team B player 2
  scores: Record<number, HoleScores>;
  wagers: Record<number, HoleWager>;
  status: 'pending' | 'active' | 'complete';
  createdAt: number;
}

export interface AppConfig {
  teamAName: string;
  teamBName: string;
  adminPin: string;
}

export interface MatchResult {
  holesPlayed: number;
  isComplete: boolean;
  teamAHolesUp: number; // positive = A leading, negative = B leading
  status: string;
  winner: TeamId | null;
  pointsA: number;
  pointsB: number;
  format: MatchFormat;
  // Strokes each player receives (0 for the scratch anchor)
  strokes: { a1: number; a2: number; b1: number; b2: number };
  strokeHoles: Record<number, { a1: number; a2: number; b1: number; b2: number }>;
}
