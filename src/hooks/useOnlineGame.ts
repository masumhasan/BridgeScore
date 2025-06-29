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

    useEffect(() => {
        if (!gameId) {
            setLoading(false);
            return;
        };

        const gameRef = doc(db, 'games', gameId);

        const unsubscribe = onSnapshot(gameRef, async (docSnap) => {
            if (docSnap.exists()) {
                const gameData = { id: docSnap.id, ...docSnap.data() } as OnlineGame;
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
    }, [gameId]);

    return { game, loading, error };
};
