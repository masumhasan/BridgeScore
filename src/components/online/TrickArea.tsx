"use client";

import type { PlayedCard } from '@/types/game';
import PlayingCard from './PlayingCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface TrickAreaProps {
    cardsOnTable: PlayedCard[];
    mySeat: number;
}

export default function TrickArea({ cardsOnTable, mySeat }: TrickAreaProps) {
    
    // Maps a player's absolute seat (0-3) to a visual position (S, W, N, E) relative to the current player
    const getPositionFromSeat = (seat: number) => {
        const relativeSeat = (seat - mySeat + 4) % 4;
        return ['S', 'W', 'N', 'E'][relativeSeat];
    };

    const cardPositions: { [key: string]: string } = {
        S: 'bottom-0 translate-y-10',
        N: 'top-0 -translate-y-10',
        W: 'left-0 -translate-x-10',
        E: 'right-0 translate-x-10',
    };

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-20">
            <div className="relative w-full h-full">
                <AnimatePresence>
                    {cardsOnTable.map(({ seat, card }) => {
                        const position = getPositionFromSeat(seat);
                        return (
                            <motion.div
                                key={`${card.rank}-${card.suit}`}
                                className={`absolute ${cardPositions[position]}`}
                                initial={{ scale: 0.5, opacity: 0, ...getPositionInitial(position) }}
                                animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                style={{ top: '50%', left: '50%' }}
                            >
                                <PlayingCard card={card} isFaceUp={true} layoutId={`trick-${card.rank}-${card.suit}`} />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

const getPositionInitial = (position: string) => {
    switch (position) {
        case 'S': return { y: '150%', x: '-50%' };
        case 'N': return { y: '-250%', x: '-50%' };
        case 'W': return { x: '-250%', y: '-50%' };
        case 'E': return { x: '150%', y: '-50%' };
        default: return {};
    }
};