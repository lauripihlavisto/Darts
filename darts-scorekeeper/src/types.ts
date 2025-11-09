export type GameType = 301 | 501;

export interface Player {
  id: number;
  name: string;
}

export interface Turn {
  id: string;
  playerId: number;
  score: number; // 0..180
  note?: string;
}

export interface LegState {
  startingScore: number;
  remaining: Record<number, number>;
  turns: Turn[];
  winnerId: number | null;
  activePlayerId: number; // whose turn
  legNumber: number; // 1-based
}

export interface SetState {
  players: Player[]; // length 2
  gameType: GameType;
  setSize: number;
  wins: Record<number, number>; // legs won per player
  legs: LegState[];
  winnerId: number | null;
  bustRule: "on" | "off";
}

export interface HistoryState {
  past: SetState[];
  present: SetState | null;
  future: SetState[];
}
