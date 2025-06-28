"use client";

import { useEffect, useState } from 'react';
import { getPastGames } from '@/services/gameService';
import type { GameState } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

const GameHistoryCard = ({ game }: { game: GameState }) => {
    const maxScore = Math.max(...game.players.map(p => p.totalScore));
    const winners = game.players.filter(p => p.totalScore === maxScore);
    const winnerText = winners.map(w => w.name).join(' & ');

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="text-xl">{game.tag || 'Game'}</CardTitle>
                <CardDescription>
                    {game.finishedAt ? new Date(game.finishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4 p-2 bg-secondary rounded-md">
                    <Trophy className="w-5 h-5 text-amber-500"/>
                    <p className="font-semibold">{winners.length > 1 ? 'Winners: ' : 'Winner: '}{winnerText} ({maxScore} pts)</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                    {game.players.map(p => (
                        <li key={p.id} className="flex justify-between items-center">
                            <span>{p.name}</span>
                            <span className="font-medium text-foreground">{p.totalScore}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};


export default function PastGamesList() {
    const [games, setGames] = useState<GameState[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true);
            const pastGames = await getPastGames();
            setGames(pastGames);
            setLoading(false);
        };
        fetchGames();
    }, []);

    if (loading) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-4">Game History</h2>
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                </div>
            </div>
        )
    }

    if (games.length === 0) {
        return (
            <div className="text-center py-16 bg-secondary/50 rounded-lg">
                <h3 className="text-xl font-semibold">No Past Games</h3>
                <p className="text-muted-foreground mt-2">Complete a game to see its results here.</p>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Game History</h2>
            <ScrollArea className="h-[calc(100vh-25rem)] pr-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {games.map(game => (
                        <GameHistoryCard key={game.id} game={game} />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
