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
                {cardsOnTable.map(({ seat, card }) => {
                    const position = getPositionFromSeat(seat);
                    return (
                        <motion.div
                            key={`${card.rank}-${card.suit}`}
                            className="absolute top-1/2 left-1/2"
                            initial={{ scale: 0.5, opacity: 0, ...getPositionInitial(position) }}
                            animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%', ...getPositionAnimate(position) }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                            <PlayingCard card={card} isFaceUp={true} layoutId={`trick-${card.rank}-${card.suit}`} />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
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

const getPositionAnimate = (position: string) => {
    switch (position) {
        case 'S': return { y: '0%' };
        case 'N': return { y: '-100%' };
        case 'W': return { x: '-100%' };
        case 'E': return { x: '0%' };
        default: return {};
    }
}
