"use client";

import { useReducer, useEffect, useCallback } from 'react';
import type { GameState, Player, GamePhase } from '@/types/game';

const LOCAL_STORAGE_KEY = 'bridgeScore_gameState';
const TOTAL_ROUNDS = 10;

type Action =
  | { type: 'START_GAME'; payload: { players: string[]; winningScore: number; tag?: string } }
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
  winningScore: 50,
});

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'START_GAME': {
      const { players, winningScore, tag } = action.payload;
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
        phase: 'making', // Round 1 starts with making tricks
        isGameActive: true,
        totalRounds: TOTAL_ROUNDS,
        winningScore,
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
      const isFirstRound = state.round === 1;
      
      const updatedPlayers = state.players.map((player, i) => {
        const made = action.payload[i];
        let roundScore = 0;

        if (isFirstRound) {
          // First round scoring: points equal tricks made
          roundScore = made;
        } else {
          // Standard scoring for subsequent rounds
          const call = player.calls[roundIndex];
          if (call !== null) {
            if (call === made) {
              roundScore = call;
            } else if (made < call || made >= call + 2) {
              roundScore = -call;
            }
            // If made === call + 1, roundScore remains 0 (neutral outcome)
          }
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

      const winner = updatedPlayers.find(p => p.totalScore >= state.winningScore);
      const nextRound = state.round + 1;
      const isGameOver = !!winner || nextRound > state.totalRounds;
      
      const nextPhase: GamePhase = isGameOver ? 'finished' : 'calling';

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

  const startGame = useCallback((players: string[], winningScore: number, tag?: string) => {
    dispatch({ type: 'START_GAME', payload: { players, winningScore, tag } });
  }, []);

  const setCalls = useCallback((calls: number[]) => {
    dispatch({ type: 'SET_CALLS', payload: calls });
  }, []);

  const setMade = useCallback((made: number[]) => {
    dispatch({ type: 'SET_MADE', payload: made });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return { gameState, startGame, setCalls, setMade, resetGame };
};
