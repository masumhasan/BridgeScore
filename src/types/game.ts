export interface Player {
  id: string;
  name: string;
  calls: (number | null)[];
  made: (number | null)[];
  scores: number[];
  totalScore: number;
}

export type GamePhase = 'calling' | 'making' | 'finished';

export interface GameState {
  id: string;
  tag?: string;
  players: Player[];
  round: number;
  dealerIndex: number;
  phase: GamePhase;
  isGameActive: boolean;
  totalRounds: number;
  winningScore: number;
}
