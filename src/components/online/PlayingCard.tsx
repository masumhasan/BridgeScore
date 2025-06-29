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

const suitConfig = {
    spades: { symbol: '♠', color: 'bg-gray-800 text-white' },
    hearts: { symbol: '♥', color: 'bg-red-600 text-white' },
    diamonds: { symbol: '♦', color: 'bg-blue-600 text-white' },
    clubs: { symbol: '♣', color: 'bg-green-600 text-white' },
};

const SuitIcon = ({ suit, className }: { suit: Card['suit'], className?: string }) => {
    const config = suitConfig[suit];
    return <span className={cn('select-none', config.color, className)}>{config.symbol}</span>;
};

export default function PlayingCard({ card, isFaceUp, isPlayable, onClick, layoutId }: PlayingCardProps) {
    if (!isFaceUp) {
        return (
             <motion.div 
                layoutId={layoutId}
                className="h-32 w-22 sm:h-36 sm:w-24 rounded-lg bg-white border-2 border-gray-200 shadow-lg flex items-center justify-center p-1"
            >
                <div className="h-full w-full rounded-md bg-gray-800 flex items-center justify-center">
                    <span className="text-4xl text-yellow-400">🃏</span>
                </div>
            </motion.div>
        );
    }

    if (!card) return null;

    const config = suitConfig[card.suit];

    return (
        <motion.div
            layoutId={layoutId}
            onClick={onClick}
            className={cn(
                "h-32 w-22 sm:h-36 sm:w-24 rounded-lg bg-white border-2 border-gray-200 shadow-lg p-1.5 flex flex-col justify-between relative transition-all duration-200",
                isPlayable && "ring-4 ring-yellow-400 ring-offset-2 ring-offset-background dark:ring-offset-gray-900",
                onClick && "cursor-pointer"
            )}
        >
            <div className="flex flex-col items-start leading-none">
                <div className={cn("text-2xl font-bold", config.color)}>{card.rank.slice(0, 2)}</div>
                <SuitIcon suit={card.suit} className="text-lg bg-transparent" />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <SuitIcon suit={card.suit} className="text-5xl bg-transparent" />
            </div>
            <div className="flex flex-col items-end rotate-180 leading-none">
                 <div className={cn("text-2xl font-bold", config.color)}>{card.rank.slice(0, 2)}</div>
                <SuitIcon suit={card.suit} className="text-lg bg-transparent" />
            </div>
        </motion.div>
    );
}
