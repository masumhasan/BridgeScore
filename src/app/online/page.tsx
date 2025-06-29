"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Globe, VenetianMask } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createGame, findAndJoinPublicGame } from '@/services/onlineGameService';

export default function OnlineLobbyPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [joinCode, setJoinCode] = useState('');
    const [isLoading, setIsLoading] = useState<null | 'create' | 'public' | 'join'>(null);

    const handleCreateGame = async (isPrivate: boolean) => {
        if (!user) {
            toast({ title: "Please log in", description: "You must be logged in to create an online game.", variant: "destructive" });
            return;
        }
        setIsLoading('create');
        try {
            const gameId = await createGame(user, isPrivate);
            router.push(`/online/game/${gameId}`);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Could not create game.", variant: "destructive" });
            setIsLoading(null);
        }
    };

    const handleJoinPublicGame = async () => {
        if (!user) {
            toast({ title: "Please log in", description: "You must be logged in to join a game.", variant: "destructive" });
            return;
        }
        setIsLoading('public');
        try {
            const gameId = await findAndJoinPublicGame(user);
            router.push(`/online/game/${gameId}`);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Could not find a public game. Why not create one?", variant: "destructive" });
            setIsLoading(null);
        }
    }

    const handleJoinWithCode = (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) {
            toast({ title: "Invalid Code", description: "Please enter a game code.", variant: "destructive" });
            return;
        }
        setIsLoading('join');
        // Basic validation, Firestore rules will do the real check
        router.push(`/online/game/${joinCode.trim()}`);
    }

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }
    
    if (!user) {
         return (
            <div className="flex h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>You need to be logged in to play online.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => router.push('/login')}>Go to Login</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">Play Online</h1>
                    <p className="text-muted-foreground">Join a game or create your own.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create a Game</CardTitle>
                            <CardDescription>Start a new game and invite your friends.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full" onClick={() => handleCreateGame(true)} disabled={!!isLoading}>
                                {isLoading === 'create' ? <Loader2 className="animate-spin"/> : <Lock />}
                                Create Private Game
                            </Button>
                             <Button className="w-full" variant="secondary" onClick={() => handleCreateGame(false)} disabled={!!isLoading}>
                                {isLoading === 'create' ? <Loader2 className="animate-spin"/> : <Globe />}
                                Create Public Game
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Join a Game</CardTitle>
                            <CardDescription>Get in on the action.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={handleJoinWithCode} className="space-y-2">
                                <Input 
                                    placeholder="Enter game code..." 
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    disabled={!!isLoading}
                                />
                                <Button type="submit" className="w-full" variant="secondary" disabled={!!isLoading}>
                                    {isLoading === 'join' ? <Loader2 className="animate-spin"/> : null}
                                    Join with Code
                                </Button>
                            </form>
                             <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                            </div>
                             <Button className="w-full" variant="outline" onClick={handleJoinPublicGame} disabled={!!isLoading}>
                                {isLoading === 'public' ? <Loader2 className="animate-spin"/> : <VenetianMask />}
                                Find a Public Game
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    )
}
