"use client";

import { motion } from 'framer-motion';
import type { Card } from '@/types/game';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
    card?: Card;
    isFaceUp: boolean;
    isPlayable?: boolean;
    onClick?: () => void;
    layoutId?: string;
}

const SuitIcon = ({ suit }: { suit: Card['suit'] }) => {
    const suitMap = {
        spades: { symbol: '♠', color: 'text-black' },
        hearts: { symbol: '♥', color: 'text-red-600' },
        diamonds: { symbol: '♦', color: 'text-red-600' },
        clubs: { symbol: '♣', color: 'text-black' },
    };
    return <span className={cn('text-2xl', suitMap[suit].color)}>{suitMap[suit].symbol}</span>;
};

export default function PlayingCard({ card, isFaceUp, isPlayable, onClick, layoutId }: PlayingCardProps) {
    if (!isFaceUp) {
        return (
             <motion.div 
                layoutId={layoutId}
                className="h-32 w-24 rounded-lg bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center"
            >
                <div className="h-28 w-20 rounded-md border-2 border-blue-300" />
            </motion.div>
        );
    }

    if (!card) return null;

    const textColor = card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black';

    return (
        <motion.div
            layoutId={layoutId}
            onClick={onClick}
            className={cn(
                "h-32 w-24 rounded-lg bg-white border border-gray-300 shadow-md p-1 flex flex-col justify-between relative",
                isPlayable && "ring-4 ring-yellow-400 ring-offset-2 ring-offset-green-800"
            )}
        >
            <div className="flex flex-col items-start">
                <div className={cn("text-2xl font-bold", textColor)}>{card.rank.slice(0, 2)}</div>
                <SuitIcon suit={card.suit} />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <SuitIcon suit={card.suit} />
            </div>
            <div className="flex flex-col items-end rotate-180">
                <div className={cn("text-2xl font-bold", textColor)}>{card.rank.slice(0, 2)}</div>
                <SuitIcon suit={card.suit} />
            </div>
        </motion.div>
    );
}