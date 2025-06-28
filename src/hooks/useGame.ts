"use client";

import { useReducer, useEffect, useCallback } from 'react';
import type { GameState, Player, GamePhase } from '@/types/game';

const LOCAL_STORAGE_KEY = 'bridgeScore_gameState';
const TOTAL_ROUNDS = 10;

type Action =
  | { type: 'START_GAME'; payload: { players: string[]; tag?: string } }
  | { type: 'SET_CALLS'; payload: number[] }
  | { type: 'SET_MADE'; payload: number[] }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_STATE'; payload: GameState };

const getInitialState = (): GameState => ({
  id: '',
  players: [],
  round: 1,
  dealerIndex: 0,
  phase: 'calling',
  isGameActive: false,
  totalRounds: TOTAL_ROUNDS,
});

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'START_GAME': {
      const { players, tag } = action.payload;
      const newPlayers: Player[] = players.map((name, index) => ({
        id: `player-${index + 1}`,
        name,
        calls: Array(TOTAL_ROUNDS).fill(null),
        made: Array(TOTAL_ROUNDS).fill(null),
        scores: Array(TOTAL_ROUNDS).fill(0),
        totalScore: 0,
      }));
      return {
        id: new Date().getTime().toString(),
        tag,
        players: newPlayers,
        round: 1,
        dealerIndex: 0,
        phase: 'calling',
        isGameActive: true,
        totalRounds: TOTAL_ROUNDS,
      };
    }
    case 'SET_CALLS': {
      const roundIndex = state.round - 1;
      const updatedPlayers = state.players.map((player, i) => ({
        ...player,
        calls: player.calls.map((c, r) => (r === roundIndex ? action.payload[i] : c)),
      }));
      return { ...state, players: updatedPlayers, phase: 'making' };
    }
    case 'SET_MADE': {
      const roundIndex = state.round - 1;
      const updatedPlayers = state.players.map((player, i) => {
        const made = action.payload[i];
        const call = player.calls[roundIndex];
        let roundScore = 0;
        if (call !== null) {
          if (call === made) {
            // If a player wins exactly as they called, add the called number to their total score
            roundScore = call;
          } else if (made < call || made >= call + 2) {
            // If a player wins fewer than called, or more than 1 over, penalize
            roundScore = -call;
          }
          // If made === call + 1, roundScore remains 0 (neutral outcome)
        }
        const newScores = player.scores.map((s, r) => (r === roundIndex ? roundScore : s));
        const newMade = player.made.map((m, r) => (r === roundIndex ? made : m));
        return {
          ...player,
          made: newMade,
          scores: newScores,
          totalScore: newScores.reduce((a, b) => a + b, 0),
        };
      });

      const nextRound = state.round + 1;
      const nextPhase: GamePhase = nextRound > state.totalRounds ? 'finished' : 'calling';

      return {
        ...state,
        players: updatedPlayers,
        round: nextRound,
        dealerIndex: (state.dealerIndex + 1) % state.players.length,
        phase: nextPhase,
      };
    }
    case 'RESET_GAME':
      return getInitialState();
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
};

export const useGame = () => {
  const [gameState, dispatch] = useReducer(gameReducer, getInitialState());

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        dispatch({ type: 'LOAD_STATE', payload: JSON.parse(savedState) });
      }
    } catch (error) {
      console.error("Failed to load game state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (gameState.isGameActive) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
      } catch (error) {
        console.error("Failed to save game state to localStorage", error);
      }
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [gameState]);

  const startGame = useCallback((players: string[], tag?: string) => {
    dispatch({ type: 'START_GAME', payload: { players, tag } });
  }, []);

  const setCalls = useCallback((calls: number[]) => {
    dispatch({ type: 'SET_CALLS', payload: calls });
  }, []);

  const setMade = useCallback((made: number[]) => {
    dispatch({ type: 'SET_MADE', payload: made });
  }, []);

  const resetGame = useCallback(() => {
    if (window.confirm('Are you sure you want to start a new game? All progress will be lost.')) {
      dispatch({ type: 'RESET_GAME' });
    }
  }, []);

  return { gameState, startGame, setCalls, setMade, resetGame };
};
