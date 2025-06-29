"use client";

import { useMemo, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { OnlineGame, Card } from '@/types/game';
import { usePlayerHand } from '@/hooks/usePlayerHand';
import { playCard, startNextTrick } from '@/services/onlineGameService';
import PlayingCard from './PlayingCard';
import PlayerAvatar from './PlayerAvatar';
import TrickArea from './TrickArea';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface GameBoardProps {
    game: OnlineGame;
    currentUser: User;
}

export default function GameBoard({ game, currentUser }: GameBoardProps) {
    const { hand, loading: handLoading } = usePlayerHand(game.id, currentUser.uid);

    const mySeat = useMemo(() => game.players.find(p => p.uid === currentUser.uid)?.seat, [game, currentUser.uid]);

    useEffect(() => {
        if (game.status === 'trick_scoring') {
            const timer = setTimeout(() => {
                if (mySeat === game.lastTrickWinnerSeat) {
                    startNextTrick(game.id);
                }
            }, 3000); 
            return () => clearTimeout(timer);
        }
    }, [game.status, game.id, game.lastTrickWinnerSeat, mySeat]);

    const playerPositions = useMemo(() => {
        if (mySeat === undefined) return {};
        const positions: { [key: string]: OnlineGame['players'][0] } = {};
        const seatMap = ['S', 'W', 'N', 'E'];
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
        });
    };

    const isMyTurn = game.currentTurnSeat === mySeat;

    const getPlayableCards = (hand: Card[], trickSuit: string | null): Card[] => {
        if (!trickSuit) return hand;
        const cardsInSuit = hand.filter(c => c.suit === trickSuit);
        return cardsInSuit.length > 0 ? cardsInSuit : hand;
    };

    const playableCards = isMyTurn ? getPlayableCards(hand, game.trickSuit) : [];

    if (handLoading || mySeat === undefined) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="relative flex h-screen w-screen select-none flex-col items-center justify-between bg-gray-100 dark:bg-gray-900 p-2 sm:p-4 font-sans overflow-hidden">
            {/* Player Avatars */}
            {playerPositions.N && <PlayerAvatar player={playerPositions.N} position="N" isCurrentTurn={game.currentTurnSeat === playerPositions.N.seat} />}
            {playerPositions.E && <PlayerAvatar player={playerPositions.E} position="E" isCurrentTurn={game.currentTurnSeat === playerPositions.E.seat} />}
            {playerPositions.W && <PlayerAvatar player={playerPositions.W} position="W" isCurrentTurn={game.currentTurnSeat === playerPositions.W.seat} />}
            
            {/* Trick Area */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <TrickArea cardsOnTable={game.cardsOnTable} mySeat={mySeat} />
            </div>

            {/* Current Player's Hand and Avatar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full flex flex-col items-center gap-4">
                {playerPositions.S && <PlayerAvatar player={playerPositions.S} position="S" isCurrentTurn={game.currentTurnSeat === playerPositions.S.seat} />}
                <div className={`flex justify-center items-end h-40 w-full transition-all duration-300 ${isMyTurn ? '' : 'opacity-80'}`}>
                    <AnimatePresence>
                        {hand.map((card, i) => {
                            const isPlayable = playableCards.some(pc => pc.rank === card.rank && pc.suit === card.suit);
                            return (
                                <motion.div 
                                     key={`${card.rank}-${card.suit}`}
                                     initial={{ opacity: 0, y: 50 }}
                                     animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                                     exit={{ opacity: 0, y: 50 }}
                                     className={`-mx-3 sm:-mx-4 transition-transform duration-200 ${isMyTurn && isPlayable ? 'hover:-translate-y-4 cursor-pointer' : 'cursor-not-allowed'}`}
                                     onClick={() => isMyTurn && isPlayable && handlePlayCard(card)}
                                >
                                    <PlayingCard
                                        card={card}
                                        isFaceUp={true}
                                        isPlayable={isPlayable}
                                        layoutId={`${card.rank}-${card.suit}`}
                                    />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
            
             {/* Game Status Overlay */}
            <AnimatePresence>
                {game.status === 'trick_scoring' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
                    >
                        <div className="text-white text-center p-8 bg-black/70 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-bold">Trick Won By</h2>
                            <p className="text-4xl font-bold mt-2 text-yellow-400">{game.players.find(p => p.seat === game.lastTrickWinnerSeat)?.name}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
