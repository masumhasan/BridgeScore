"use client";

import type { GameState } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Spade, X, Crown } from 'lucide-react';
import ScoreTable from './ScoreTable';
import RoundInput from './RoundInput';
import { useMemo } from 'react';

interface GameScreenProps {
  gameState: GameState;
  setCalls: (calls: number[]) => void;
  setMade: (made: number[]) => void;
  setOutcomes: (outcomes: ('won' | 'lost')[]) => void;
  resetGame: () => void;
}

export default function GameScreen({ gameState, setCalls, setMade, setOutcomes, resetGame }: GameScreenProps) {
  const { players, round, totalRounds, phase, tag } = gameState;

  const winner = useMemo(() => {
    if (phase !== 'finished') return null;
    const maxScore = Math.max(...players.map(p => p.totalScore));
    return players.filter(p => p.totalScore === maxScore);
  }, [players, phase]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Spade className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">BridgeScore</h1>
            {tag && <p className="text-muted-foreground">{tag}</p>}
          </div>
        </div>
        <Button onClick={resetGame} variant="destructive" size="sm">
          <X className="mr-2 h-4 w-4" /> Close Game
        </Button>
      </header>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {players.map(player => (
            <Card key={player.id}>
                <CardHeader className="p-2 md:p-4">
                    <CardDescription>{player.name}</CardDescription>
                    <CardTitle className="text-2xl">{player.totalScore}</CardTitle>
                </CardHeader>
            </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScoreTable players={players} totalRounds={totalRounds} currentRound={round} dealerIndex={gameState.dealerIndex} />
        </div>
        <div className="lg:col-span-1">
          {phase !== 'finished' ? (
            <RoundInput
              key={`${round}-${phase}`}
              round={round}
              phase={phase}
              players={players}
              dealerIndex={gameState.dealerIndex}
              setCalls={setCalls}
              setMade={setMade}
              setOutcomes={setOutcomes}
            />
          ) : (
            <Card className="shadow-lg animate-in fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Crown className="text-amber-400"/>Game Over!</CardTitle>
                <CardDescription>
                  {winner && winner.length > 1 ? "It's a tie!" : `The winner is...`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {winner && winner.map(w => (
                   <div key={w.id} className="text-center p-4 bg-secondary rounded-lg">
                    <p className="text-3xl font-bold text-accent">{w.name}</p>
                    <p className="text-lg text-muted-foreground">with {w.totalScore} points</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
