"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { OnlineGame } from '@/types/game';
import { useAuth } from '@/context/AuthContext';
import { joinGame } from '@/services/onlineGameService';

export const useOnlineGame = (gameId: string) => {
    const [game, setGame] = useState<OnlineGame | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!gameId || !user) {
            if (!user) setError("You must be logged in.");
            setLoading(false);
            return;
        };

        const gameRef = doc(db, 'games', gameId);

        const unsubscribe = onSnapshot(gameRef, async (docSnap) => {
            if (docSnap.exists()) {
                const gameData = { id: docSnap.id, ...docSnap.data() } as OnlineGame;
                
                // If user is not in the player list and there's space, try to join
                const isPlayer = gameData.players.some(p => p.uid === user.uid);
                if (!isPlayer && gameData.players.length < 4 && gameData.status === 'waiting') {
                    try {
                        await joinGame(gameId, user);
                        // The snapshot listener will pick up the change, no need to set state here
                    } catch (e) {
                         setError("Could not join game. It might be full or already started.");
                    }
                } else if (!isPlayer) {
                    setError("You are not a player in this game and it is full or has already started.");
                }

                setGame(gameData);
                setError(null);
            } else {
                setError("Game not found. Check the code and try again.");
                setGame(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error listening to game document:", err);
            setError("Failed to connect to the game.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [gameId, user]);

    return { game, loading, error };
};
