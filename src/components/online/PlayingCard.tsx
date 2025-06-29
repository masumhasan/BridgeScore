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
    spades: { symbol: '♠', color: 'bg-slate-800 text-white' },
    hearts: { symbol: '♥', color: 'bg-rose-500 text-white' },
    diamonds: { symbol: '♦', color: 'bg-amber-400 text-slate-900' },
    clubs: { symbol: '♣', color: 'bg-teal-500 text-white' },
};


export default function PlayingCard({ card, isFaceUp, isPlayable, onClick, layoutId }: PlayingCardProps) {
    if (!isFaceUp) {
        return (
             <motion.div 
                layoutId={layoutId}
                className="h-36 w-24 rounded-lg bg-white border-2 border-gray-200 shadow-lg flex items-center justify-center p-1"
            >
                <div className="h-full w-full rounded-md bg-slate-800 flex items-center justify-center">
                    <span className="text-4xl text-amber-400">?</span>
                </div>
            </motion.div>
        );
    }

    if (!card) return null;

    const config = suitConfig[card.suit];
    const rankDisplay = card.rank.length > 2 ? card.rank.charAt(0) : card.rank;

    return (
        <motion.div
            layoutId={layoutId}
            onClick={onClick}
            className={cn(
                "h-36 w-24 rounded-lg p-2 flex flex-col justify-between relative shadow-lg border-2 border-black/10",
                config.color,
                isPlayable && "ring-4 ring-yellow-400 ring-offset-2 ring-offset-background dark:ring-offset-gray-900",
                onClick && "cursor-pointer"
            )}
        >
            <div className="flex flex-col items-start leading-none font-bold">
                <div className="text-2xl">{rankDisplay}</div>
                <div className="text-xl -mt-1">{config.symbol}</div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl opacity-50">
                {config.symbol}
            </div>

            <div className="flex flex-col items-end leading-none font-bold rotate-180">
                <div className="text-2xl">{rankDisplay}</div>
                <div className="text-xl -mt-1">{config.symbol}</div>
            </div>
        </motion.div>
    );
}
