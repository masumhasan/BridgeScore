"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Card, PlayerHand } from '@/types/game';

export const usePlayerHand = (gameId: string, userId: string | undefined) => {
    const [hand, setHand] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!gameId || !userId) {
            setHand([]);
            setLoading(false);
            return;
        }

        const handRef = doc(db, 'games', gameId, 'private', userId);
        const unsubscribe = onSnapshot(handRef, (docSnap) => {
            if (docSnap.exists()) {
                const handData = docSnap.data() as PlayerHand;
                setHand(handData.hand || []);
            } else {
                setHand([]);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error listening to player hand:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [gameId, userId]);

    return { hand, loading };
};