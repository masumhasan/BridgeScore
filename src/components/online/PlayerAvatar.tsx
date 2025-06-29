"use client";

import type { OnlinePlayer } from '@/types/game';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
    player: OnlinePlayer;
    position: 'N' | 'E' | 'S' | 'W';
    isCurrentTurn: boolean;
}

const positionClasses = {
    N: 'top-4 left-1/2 -translate-x-1/2 flex-col',
    S: 'mb-4 flex-col', // South is positioned by its parent container
    E: 'right-4 top-1/2 -translate-y-1/2 flex-row-reverse gap-2 text-right',
    W: 'left-4 top-1/2 -translate-y-1/2 flex-row gap-2 text-left',
};

const avatarSizeClasses = {
    N: 'h-12 w-12 text-base',
    S: 'h-14 w-14 text-lg',
    E: 'h-12 w-12 text-base',
    W: 'h-12 w-12 text-base',
}

export default function PlayerAvatar({ player, position, isCurrentTurn }: PlayerAvatarProps) {
    return (
        <div className={cn(
            'flex items-center justify-center gap-2 p-2 rounded-lg bg-black/10 dark:bg-black/40 text-foreground z-10', 
            position !== 'S' ? `absolute ${positionClasses[position]}` : positionClasses[position]
        )}>
            <div className={cn('relative transition-all duration-300', isCurrentTurn && 'ring-4 ring-yellow-400 rounded-full')}>
                <Avatar className={cn('border-2 border-white', avatarSizeClasses[position])}>
                    <AvatarImage src={player.photoURL ?? undefined} />
                    <AvatarFallback>{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {player.isBot && <Bot className="absolute -bottom-1 -right-1 h-5 w-5 bg-gray-700 text-white rounded-full p-0.5" />}
            </div>
            <div className={cn("text-center", position === 'E' && "text-right", position === 'W' && "text-left")}>
                <p className="font-bold text-sm">{player.name}</p>
                <div className={cn('text-xs flex gap-2', 
                    (position === 'N' || position === 'S') ? 'flex-row justify-center' : 'flex-col'
                )}>
                  <p>Tricks: <span className="font-bold">{player.tricksWon}</span></p>
                  <p>Score: <span className="font-bold">{player.score}</span></p>
                </div>
            </div>
        </div>
    );
}
