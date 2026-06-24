export type TeamId = 'A' | 'B';
export type MatchFormat = 'singles' | 'fourball';

export interface Player {
  id: string;
  name: string;
  email?: string;
  authUid?: string;
  rivalId?: string;
  teamId: TeamId;
  handicap: number;
  teebox?: string;
  createdAt: number;
}

export interface Trip {
  id: string;
  name: string;
  year: number;
  teamAName?: string;
  teamBName?: string;
  backgroundUrl?: string;
  captainAId?: string;
  captainBId?: string;
  createdAt: number;
}

export type TeeGender = 'male' | 'female' | 'unisex';

export interface Round {
  id: string;
  tripId?: string;
  number: number;
  courseName: string;
  courseApiId?: number;
  savedCourseId?: string;
  courseClubName?: string;
  teeName?: string;
  teeGender?: TeeGender;
  courseRating?: number;
  slopeRating?: number;
  courseLogoUrl?: string;
  courseBrandColor?: string;
  pars?: number[];
  yardages?: number[];
  // strokeIndexes[i] = stroke index rating for hole (i+1), values 1–18
  strokeIndexes: number[];
  createdAt: number;
}

export interface GolfCourseHole {
  par: number;
  yardage: number;
  handicap: number;
}

export interface GolfCourseTeeBox {
  tee_name: string;
  course_rating?: number;
  slope_rating?: number;
  total_yards?: number;
  number_of_holes?: number;
  par_total?: number;
  holes?: GolfCourseHole[];
}

export interface GolfCourseApiCourse {
  id: number;
  club_name: string;
  course_name: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  tees?: {
    male?: GolfCourseTeeBox[];
    female?: GolfCourseTeeBox[];
  };
}

export interface SavedCourseTeeBox {
  id: string;
  teeName: string;
  gender: TeeGender;
  courseRating?: number;
  slopeRating?: number;
  totalYards: number;
  parTotal: number;
  holes: GolfCourseHole[];
}

export interface SavedCourse {
  id: string;
  clubName: string;
  courseName?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  logoUrl?: string;
  brandColor?: string;
  tees: SavedCourseTeeBox[];
  source: 'manual';
  createdAt: number;
  updatedAt?: number;
}

export interface SoloRound {
  id: string;
  playerId: string;
  authUid?: string;
  playerName: string;
  playedAt: string;
  courseName: string;
  courseApiId?: number;
  savedCourseId?: string;
  courseClubName?: string;
  teeName?: string;
  teeGender?: TeeGender;
  courseRating?: number;
  slopeRating?: number;
  courseLogoUrl?: string;
  courseBrandColor?: string;
  pars?: number[];
  yardages?: number[];
  strokeIndexes: number[];
  scores: Record<number, number | null>;
  status: 'active' | 'complete';
  createdAt: number;
  updatedAt?: number;
}

export interface HoleScores {
  // Singles: playerA / playerB
  // Fourball: playerA = A player 1, playerA2 = A player 2, etc.
  playerA?: number;
  playerB?: number;
  playerA2?: number;
  playerB2?: number;
}

export type WagerType = 'money' | 'drinks' | 'bragging_rights' | 'custom';

export interface Wager {
  type: WagerType;
  amount: string; // dollar amount for money; free text for others
  createdAt: number;
}

export type HoleWager = Wager;

export interface ManualPlayerTotals {
  playerA?: number;
  playerA2?: number;
  playerB?: number;
  playerB2?: number;
}

export interface ManualResult {
  teamAScore?: number;
  teamBScore?: number;
  playerTotals?: ManualPlayerTotals;
  pointsA: number;
  pointsB: number;
  note?: string;
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
  teeTime?: string;
  scores: Record<number, HoleScores>;
  wagers: Record<number, HoleWager>;
  matchWager?: Wager;
  manualResult?: ManualResult;
  status: 'pending' | 'active' | 'complete';
  createdAt: number;
}

export interface AppConfig {
  teamAName: string;
  teamBName: string;
  adminPin: string;
  activeTripId?: string;
}

export type TripEventCategory = 'golf' | 'meal' | 'travel' | 'lodging' | 'meeting' | 'other';

export interface TripEvent {
  id: string;
  tripId: string;
  date: string;
  time?: string;
  title: string;
  location?: string;
  notes?: string;
  category: TripEventCategory;
  createdAt: number;
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
