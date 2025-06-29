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
  finishedAt?: string;
  hostId?: string;
  hostName?: string;
  hostPhotoURL?: string;
}

// Types for Real-time Online Gameplay
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // For sorting, A=14, K=13, etc.
}

export interface OnlinePlayer {
  uid: string;
  name: string;
  photoURL: string | null;
  isBot: boolean;
  seat: number; // 0 (North), 1 (East), 2 (South), 3 (West)
  score: number;
  tricksWon: number;
}

export interface PlayerHand {
    hand: Card[];
}

export type OnlineGameStatus = 'waiting' | 'playing' | 'calling' | 'trick_scoring' | 'round_scoring' | 'finished';

export interface PlayedCard {
  seat: number;
  card: Card;
}

export interface OnlineGame {
  id: string;
  hostId: string;
  status: OnlineGameStatus;
  players: OnlinePlayer[];
  settings: {
    isPrivate: boolean;
    winningScore: number;
  };
  // Gameplay state
  deck?: Card[];
  currentRound: number; // 1-13
  currentTrick: number; // 1-13
  currentTurnSeat: number;
  trickSuit: Suit | null;
  cardsOnTable: PlayedCard[];
  lastTrickWinnerSeat?: number;
  calls: Record<string, number | null>; // { [uid]: call }
}