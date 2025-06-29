"use client";

import { useMemo, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { OnlineGame, OnlinePlayer, Card } from '@/types/game';
import { usePlayerHand } from '@/hooks/usePlayerHand';
import { playCard, startNextTrick } from '@/services/onlineGameService';
import PlayingCard from './PlayingCard';
import PlayerAvatar from './PlayerAvatar';
import TrickArea from './TrickArea';
import { Loader2 } from 'lucide-react';

interface GameBoardProps {
    game: OnlineGame;
    currentUser: User;
}

export default function GameBoard({ game, currentUser }: GameBoardProps) {
    const { hand, loading: handLoading } = usePlayerHand(game.id, currentUser.uid);

    const mySeat = useMemo(() => game.players.find(p => p.uid === currentUser.uid)?.seat, [game, currentUser.uid]);

    // This effect handles automatically moving to the next trick after a brief pause
    useEffect(() => {
        if (game.status === 'trick_scoring') {
            const timer = setTimeout(() => {
                // To prevent multiple clients from calling this, only the winner of the last trick proceeds.
                if (mySeat === game.lastTrickWinnerSeat) {
                    startNextTrick(game.id);
                }
            }, 3000); // 3-second pause to see who won
            return () => clearTimeout(timer);
        }
    }, [game.status, game.id, game.lastTrickWinnerSeat, mySeat]);

    const playerPositions = useMemo(() => {
        if (mySeat === undefined) return {};
        const positions: { [key: string]: OnlinePlayer } = {};
        const seatMap = ['S', 'W', 'N', 'E']; // S=0, W=1, N=2, E=3 relative to me
        for (let i = 0; i < 4; i++) {
            const playerSeat = (mySeat + i) % 4;
            const player = game.players.find(p => p.seat === playerSeat);
            if (player) {
                positions[seatMap[i]] = player;
            }
        }
        return positions;
    }, [game.players, mySeat]);

    const handlePlayCard = (card: Card) => {
        if (game.status !== 'playing' || mySeat !== game.currentTurnSeat) return;
        playCard(game.id, currentUser.uid, card).catch(err => {
            console.error("Failed to play card:", err);
            // Optionally, show a toast message to the user
        });
    };

    const isMyTurn = game.currentTurnSeat === mySeat;

    const getPlayableCards = (hand: Card[], trickSuit: string | null): Card[] => {
        if (!trickSuit) return hand; // Can play anything if leading
        const cardsInSuit = hand.filter(c => c.suit === trickSuit);
        return cardsInSuit.length > 0 ? cardsInSuit : hand;
    };

    const playableCards = isMyTurn ? getPlayableCards(hand, game.trickSuit) : [];

    if (handLoading || mySeat === undefined) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-green-800">
                <Loader2 className="h-16 w-16 animate-spin text-white" />
            </div>
        );
    }
    
    return (
        <div className="relative flex h-screen w-screen select-none flex-col items-center justify-center bg-green-800 p-4 font-sans overflow-hidden">
            {/* Player Avatars */}
            {playerPositions.N && <PlayerAvatar player={playerPositions.N} position="N" isCurrentTurn={game.currentTurnSeat === playerPositions.N.seat} />}
            {playerPositions.E && <PlayerAvatar player={playerPositions.E} position="E" isCurrentTurn={game.currentTurnSeat === playerPositions.E.seat} />}
            {playerPositions.S && <PlayerAvatar player={playerPositions.S} position="S" isCurrentTurn={game.currentTurnSeat === playerPositions.S.seat} />}
            {playerPositions.W && <PlayerAvatar player={playerPositions.W} position="W" isCurrentTurn={game.currentTurnSeat === playerPositions.W.seat} />}
            
            {/* Trick Area */}
            <TrickArea cardsOnTable={game.cardsOnTable} mySeat={mySeat} />
            
             {/* Other player hands (card backs) */}
             <div className="absolute top-[20%] left-1/2 -translate-x-1/2 flex">
                {Array.from({ length: 13 - game.cardsOnTable.filter(c => c.seat === playerPositions.N?.seat).length }).map((_, i) => (
                     <PlayingCard key={i} isFaceUp={false} layoutId={`north_card_${i}`}/>
                ))}
            </div>
             <div className="absolute top-1/2 right-[10%] -translate-y-1/2 flex flex-col">
                 {Array.from({ length: 13 - game.cardsOnTable.filter(c => c.seat === playerPositions.E?.seat).length }).map((_, i) => (
                     <PlayingCard key={i} isFaceUp={false} layoutId={`east_card_${i}`} />
                 ))}
             </div>
             <div className="absolute top-1/2 left-[10%] -translate-y-1/2 flex flex-col">
                  {Array.from({ length: 13 - game.cardsOnTable.filter(c => c.seat === playerPositions.W?.seat).length }).map((_, i) => (
                     <PlayingCard key={i} isFaceUp={false} layoutId={`west_card_${i}`} />
                 ))}
             </div>

            {/* Current Player's Hand */}
            <div className="absolute bottom-4 flex justify-center w-full">
                <div className={`flex transition-all duration-300 ${isMyTurn ? 'scale-105' : 'opacity-80'}`}>
                    {hand.map((card, i) => {
                        const isPlayable = playableCards.some(pc => pc.rank === card.rank && pc.suit === card.suit);
                        return (
                            <div key={`${card.rank}-${card.suit}`} 
                                 className={`-mx-4 transition-transform duration-200 hover:-translate-y-4 ${isMyTurn && isPlayable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                 onClick={() => isMyTurn && isPlayable && handlePlayCard(card)}
                                 style={{ transform: `rotate(${(i - hand.length / 2) * 5}deg)` }}
                                 >
                                <PlayingCard
                                    card={card}
                                    isFaceUp={true}
                                    isPlayable={isPlayable}
                                    layoutId={`${card.rank}-${card.suit}`}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            
             {/* Game Status Overlay */}
            {game.status === 'trick_scoring' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="text-white text-center p-8 bg-black/70 rounded-xl">
                        <h2 className="text-2xl font-bold">Trick Won By</h2>
                        <p className="text-4xl font-bold mt-2">{game.players.find(p => p.seat === game.lastTrickWinnerSeat)?.name}</p>
                    </div>
                </div>
            )}
        </div>
    );
}