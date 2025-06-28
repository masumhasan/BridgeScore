"use client";

import { useState, useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import NewGameForm from '@/components/game/NewGameForm';
import GameScreen from '@/components/game/GameScreen';
import { Toaster } from '@/components/ui/toaster';
import { Spade } from 'lucide-react';

export default function Home() {
  const { gameState, ...gameActions } = useGame();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary">
          <Spade className="w-16 h-16 mb-4 animate-spin" />
          <h1 className="text-2xl font-bold">BridgeScore</h1>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-body">
      <div className="container mx-auto p-4 md:p-8">
        {gameState.isGameActive ? (
          <GameScreen gameState={gameState} {...gameActions} />
        ) : (
          <NewGameForm startGame={gameActions.startGame} />
        )}
      </div>
      <Toaster />
    </main>
  );
}
