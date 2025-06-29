"use client";

import { useState, useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import { useAuth } from '@/context/AuthContext';
import NewGameForm from '@/components/game/NewGameForm';
import GameScreen from '@/components/game/GameScreen';
import PastGamesList from '@/components/game/PastGamesList';
import { Toaster } from '@/components/ui/toaster';
import { Spade, PlusCircle, Loader2, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserNav } from '@/components/auth/UserNav';
import { LoginButton } from '@/components/auth/LoginButton';
import Link from 'next/link';

export default function Home() {
  const { gameState, ...gameActions } = useGame();
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isNewGameDialogOpen, setIsNewGameDialogOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGameStarted = (players: string[], winningScore: number, tag?: string) => {
    if (user) {
        gameActions.startGame(players, winningScore, tag, user.uid, user.displayName, user.photoURL);
    } else {
        gameActions.startGame(players, winningScore, tag);
    }
    setIsNewGameDialogOpen(false);
  };

  if (!isClient || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary">
          <Loader2 className="w-16 h-16 mb-4 animate-spin" />
          <h1 className="text-2xl font-bold">Loading BridgeScore...</h1>
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
              <div className="flex items-center gap-4">
                <Dialog open={isNewGameDialogOpen} onOpenChange={setIsNewGameDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Play Offline
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-2xl">
                        Set Up Offline Game
                      </DialogTitle>
                      <DialogDescription>
                        {user ? "Your game will be saved to your profile upon completion." : "Log in to save your game history."}
                      </DialogDescription>
                    </DialogHeader>
                    <NewGameForm startGame={handleGameStarted} />
                  </DialogContent>
                </Dialog>
                 <Link href="/online">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Gamepad2 className="mr-2 h-5 w-5" />
                    Play Online
                  </Button>
                </Link>
                <ThemeToggle />
                {user ? <UserNav /> : <LoginButton />}
              </div>
            </header>
            
            <PastGamesList />
          </div>
        )}
      </div>
      <Toaster />
    </main>
  );
}
