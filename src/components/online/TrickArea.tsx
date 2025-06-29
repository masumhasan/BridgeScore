"use client";

import type { PlayedCard } from '@/types/game';
import PlayingCard from './PlayingCard';
import { motion, AnimatePresence } from 'framer-motion';

interface TrickAreaProps {
    cardsOnTable: PlayedCard[];
    mySeat: number;
}

export default function TrickArea({ cardsOnTable, mySeat }: TrickAreaProps) {
    
    const getPositionFromSeat = (seat: number) => {
        const relativeSeat = (seat - mySeat + 4) % 4;
        return ['S', 'W', 'N', 'E'][relativeSeat];
    };

    return (
        <div className="relative w-48 h-56">
            <AnimatePresence>
                {cardsOnTable.map(({ seat, card }, index) => {
                    const position = getPositionFromSeat(seat);
                    return (
                        <motion.div
                            key={`${card.rank}-${card.suit}`}
                            className="absolute top-1/2 left-1/2"
                            initial={{ scale: 0, opacity: 0, ...getPositionInitial(position) }}
                            animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%', ...getPositionAnimate(position) }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.1 }}
                            style={{ zIndex: index }}
                        >
                            <PlayingCard card={card} isFaceUp={true} />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

const getPositionInitial = (position: string) => {
    switch (position) {
        case 'S': return { y: '200%', x: '-50%' };
        case 'N': return { y: '-200%', x: '-50%' };
        case 'W': return { x: '-200%', y: '-50%' };
        case 'E': return { x: '200%', y: '-50%' };
        default: return {};
    }
};

const getPositionAnimate = (position: string) => {
    switch (position) {
        case 'S': return { y: '20%', rotate: -5 };
        case 'N': return { y: '-20%', rotate: 5 };
        case 'W': return { x: '-25%', y: '0%', rotate: -15 };
        case 'E': return { x: '25%', y: '0%', rotate: 15 };
        default: return {};
    }
}
