export interface UserProfile {
  uid: string;
  username: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Match {
  id: string; // e.g. "A_1"
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  status: 'pending' | 'played' | 'cancelled';
  order: number;
}

export interface Prediction {
  id: string; // "userId_matchId"
  userId: string;
  userName: string;
  matchId: string;
  scoreA: number | null;
  scoreB: number | null;
  pointsEarned: number;
  exactScore: boolean;
  correctOutcome: boolean;
  updatedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  exactScoresCount: number;
  correctOutcomesCount: number;
  incorrectCount: number;
}

export interface GroupStanding {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // Goals For
  ga: number; // Goals Against
  gd: number; // Goal Difference
  points: number;
}
