"use client";

import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import WaitingRoom from '@/components/online/WaitingRoom';
import GameBoard from '@/components/online/GameBoard';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OnlineGamePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const gameId = params.gameId as string;
    const { user, loading: authLoading } = useAuth();

    const guestUid = searchParams.get('guestUid');
    const guestName = searchParams.get('guestName');
    const activeUser = user || (guestUid ? { uid: guestUid, displayName: guestName || 'You', photoURL: null } : null);
    
    const { game, loading: gameLoading, error } = useOnlineGame(gameId);
    
    if (authLoading || gameLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        );
    }
    
    if (!activeUser) {
        return (
             <div className="flex h-screen w-full items-center justify-center text-center">
                <div>
                    <h2 className="text-2xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground">You must be logged in or have a guest pass to view this game.</p>
                    <Button asChild variant="link" className="mt-4">
                        <Link href="/login">Go to Login</Link>
                    </Button>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center text-center">
                <div>
                    <h2 className="text-2xl font-bold text-destructive">Error</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Button asChild variant="link" className="mt-4">
                        <Link href="/online">Back to Lobby</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin" />
                <p className="ml-4">Loading game...</p>
            </div>
        );
    }

    return (
        <div>
            {game.status === 'waiting' && <WaitingRoom game={game} currentUser={activeUser} />}
            {game.status !== 'waiting' && <GameBoard game={game} currentUser={activeUser} />}
        </div>
    );
}
