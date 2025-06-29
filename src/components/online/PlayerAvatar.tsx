"use client";

import type { OnlinePlayer } from '@/types/game';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
    player: OnlinePlayer;
    position: 'N' | 'E' | 'S' | 'W';
    isCurrentTurn: boolean;
}

const positionClasses = {
    N: 'top-4 left-1/2 -translate-x-1/2 flex-col',
    S: 'bottom-28 left-1/2 -translate-x-1/2 flex-col',
    E: 'right-4 top-1/2 -translate-y-1/2 flex-col',
    W: 'left-4 top-1/2 -translate-y-1/2 flex-col',
};

export default function PlayerAvatar({ player, position, isCurrentTurn }: PlayerAvatarProps) {
    return (
        <div className={cn('absolute flex items-center justify-center gap-2 p-2 rounded-lg bg-black/40 text-white z-10', positionClasses[position])}>
            <div className={cn('relative transition-all duration-300', isCurrentTurn && 'ring-4 ring-yellow-400 rounded-full')}>
                <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={player.photoURL ?? undefined} />
                    <AvatarFallback>{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {player.isBot && <Bot className="absolute -bottom-1 -right-1 h-5 w-5 bg-gray-700 text-white rounded-full p-0.5" />}
            </div>
            <div className="text-center">
                <p className="font-bold text-sm">{player.name}</p>
                <p className="text-xs">Tricks: {player.tricksWon}</p>
                <p className="text-xs">Score: {player.score}</p>
            </div>
        </div>
    );
}