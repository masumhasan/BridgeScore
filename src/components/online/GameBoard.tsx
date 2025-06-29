"use client";

import type { User } from 'firebase/auth';
import type { OnlineGame } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GameBoardProps {
    game: OnlineGame;
    currentUser: User;
}

export default function GameBoard({ game, currentUser }: GameBoardProps) {
    
    // This component is a placeholder for now.
    // It will be built out in the next steps to include the full game UI.

    return (
        <div className="min-h-screen bg-green-800 text-white p-4">
            <Card className="max-w-4xl mx-auto bg-green-900/80 border-green-700 text-white">
                <CardHeader>
                    <CardTitle className="text-center">Game in Progress (Round {game.currentRound})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-bold mb-4">The game board will be rendered here.</h2>
                        <p>Current Status: <span className="font-bold capitalize">{game.status.replace('_', ' ')}</span></p>
                        <p>It's seat <span className="font-bold">{game.currentTurnSeat}</span>'s turn.</p>
                        
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {game.players.map(p => (
                                <div key={p.uid} className="p-4 border rounded-lg">
                                    <p className="font-bold">{p.name} {p.uid === currentUser.uid && "(You)"}</p>
                                    <p>Score: {p.score}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
