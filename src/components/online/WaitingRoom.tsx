"use client";

import type { User } from 'firebase/auth';
import type { OnlineGame } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { dealCardsAndStartGame } from '@/services/onlineGameService';

interface WaitingRoomProps {
    game: OnlineGame;
    currentUser: User;
}

const PlayerSlot = ({ player }: { player?: OnlineGame['players'][0] }) => {
    return (
        <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-secondary/50 h-32 justify-center">
            {player ? (
                 <>
                    <Avatar>
                        <AvatarImage src={player.photoURL ?? ''} />
                        <AvatarFallback>{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-center truncate w-full">{player.name}</span>
                </>
            ) : (
                <>
                    <Avatar>
                        <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">Waiting...</span>
                </>
            )}
        </div>
    )
}

export default function WaitingRoom({ game, currentUser }: WaitingRoomProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const isHost = game.hostId === currentUser.uid;
    const canStart = isHost && game.players.length === 4;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(game.id);
        setCopied(true);
        toast({ title: "Copied!", description: "Game code copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleStartGame = async () => {
        if (!canStart) return;
        setIsStarting(true);
        try {
            await dealCardsAndStartGame(game.id, currentUser.uid);
            // The listener in useOnlineGame will handle the state change
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ title: "Error starting game", description: errorMessage, variant: "destructive" });
            setIsStarting(false);
        }
    }

    return (
        <main className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
            <Card className="w-full max-w-3xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Game Lobby</CardTitle>
                    <CardDescription>
                       {game.settings.isPrivate ? "Waiting for players to join your private game." : "Waiting for players to join this public game."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {game.settings.isPrivate && (
                        <div className="p-4 border-dashed border-2 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-4">
                            <div className="text-center sm:text-left">
                                <p className="text-sm font-semibold text-muted-foreground">INVITE CODE</p>
                                <p className="text-2xl font-mono break-all">{game.id}</p>
                            </div>
                            <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                {copied ? <Check className="text-green-500" /> : <Copy />}
                            </Button>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                           <PlayerSlot key={index} player={game.players.find(p => p.seat === index)} />
                        ))}
                    </div>

                    <div className="text-center text-muted-foreground">
                        <p>{game.players.length} / 4 players have joined.</p>
                        {game.players.length < 4 && <p>Waiting for more players to start...</p>}
                    </div>

                    {isHost && (
                        <div className="flex justify-center pt-4">
                            <Button 
                                size="lg" 
                                disabled={!canStart || isStarting} 
                                onClick={handleStartGame}
                                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                            >
                                {isStarting && <Loader2 className="mr-2 animate-spin" />}
                                {canStart ? 'Start Game' : 'Waiting for 4 players'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    )
}
