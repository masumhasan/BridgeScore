"use client";

import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { GameState, Player, GamePhase } from '@/types/game';

const LOCAL_STORAGE_KEY = 'bridgeScore_gameState';
const TOTAL_ROUNDS = 10;

type Action =
  | { type: 'START_GAME'; payload: { players: string[]; winningScore: number; tag?: string; } }
  | { type: 'SET_CALLS'; payload: number[] }
  | { type: 'SET_MADE'; payload: number[] }
  | { type: 'SET_OUTCOMES'; payload: ('won' | 'lost')[] }
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

const finishRound = (state: GameState, updatedPlayers: Player[]): GameState => {
  const winner = updatedPlayers.find(p => p.totalScore >= state.winningScore);
  const nextRound = state.round + 1;
  const isGameOver = !!winner || nextRound > state.totalRounds;
  
  const nextPhase: GamePhase = isGameOver ? 'finished' : (nextRound === 1 ? 'making' : 'calling');

  const finishedState: GameState = {
    ...state,
    players: updatedPlayers,
    round: nextRound,
    dealerIndex: (state.dealerIndex + 1) % state.players.length,
    phase: nextPhase,
  };

  if (isGameOver) {
      finishedState.finishedAt = new Date().toISOString();
  }

  return finishedState;
};


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
      // This case is now only for Round 1
      if (state.round !== 1) return state;

      const roundIndex = 0;
      
      const updatedPlayers = state.players.map((player, i) => {
        const made = action.payload[i];
        const roundScore = made === 8 ? 13 : made; // If 8 tricks made, score is 13. Otherwise, score is tricks made.
        
        const newScores = [...player.scores];
        newScores[roundIndex] = roundScore;

        const newMade = [...player.made];
        newMade[roundIndex] = made;
        
        return {
          ...player,
          made: newMade,
          scores: newScores,
          totalScore: newScores.reduce((a, b) => a + b, 0),
        };
      });

      return finishRound(state, updatedPlayers);
    }
    case 'SET_OUTCOMES': {
      // This case is for rounds > 1
      if (state.round <= 1) return state;
      const roundIndex = state.round - 1;

      const updatedPlayers = state.players.map((player, i) => {
          const call = player.calls[roundIndex];
          const outcome = action.payload[i];
          let roundScore = 0;
          let madeValue: number | null = null;

          if (call !== null) {
              if (outcome === 'won') {
                  roundScore = call === 8 ? 13 : call; // If won with a call of 8, score 13.
                  madeValue = call;
              } else { // lost
                  roundScore = -call;
                  madeValue = null; // Use null to indicate a loss where exact tricks aren't specified
              }
          }
        
          const newScores = [...player.scores];
          newScores[roundIndex] = roundScore;

          const newMade = [...player.made];
          newMade[roundIndex] = madeValue;
        
          return {
            ...player,
            made: newMade,
            scores: newScores,
            totalScore: newScores.reduce((a, b) => a + b, 0),
          };
      });

      return finishRound(state, updatedPlayers);
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
  const prevStateRef = useRef<GameState>();

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const loadedState = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', payload: loadedState });
        prevStateRef.current = loadedState;
      }
    } catch (error) {
      console.error("Failed to load game state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (gameState.isGameActive) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    prevStateRef.current = gameState;
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

  const setOutcomes = useCallback((outcomes: ('won' | 'lost')[]) => {
    dispatch({ type: 'SET_OUTCOMES', payload: outcomes });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return { gameState, startGame, setCalls, setMade, setOutcomes, resetGame };
};
