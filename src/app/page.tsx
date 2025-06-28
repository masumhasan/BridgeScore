"use client";

import { useState, useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import NewGameForm from '@/components/game/NewGameForm';
import GameScreen from '@/components/game/GameScreen';
import PastGamesList from '@/components/game/PastGamesList';
import { Toaster } from '@/components/ui/toaster';
import { Spade, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Home() {
  const { gameState, ...gameActions } = useGame();
  const [isClient, setIsClient] = useState(false);
  const [isNewGameDialogOpen, setIsNewGameDialogOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGameStarted = (players: string[], winningScore: number, tag?: string) => {
    gameActions.startGame(players, winningScore, tag);
    setIsNewGameDialogOpen(false);
  };

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
          <div className="space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-6">
              <div className="flex items-center gap-3">
                <Spade className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-primary">BridgeScore</h1>
              </div>
              <Dialog open={isNewGameDialogOpen} onOpenChange={setIsNewGameDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    New Game
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      Set Up New Game
                    </DialogTitle>
                    <DialogDescription>
                      Enter player names and a winning score to begin.
                    </DialogDescription>
                  </DialogHeader>
                  <NewGameForm startGame={handleGameStarted} />
                </DialogContent>
              </Dialog>
            </header>
            
            <PastGamesList />
          </div>
        )}
      </div>
      <Toaster />
    </main>
  );
}
