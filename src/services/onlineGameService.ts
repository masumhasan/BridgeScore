"use server";

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, writeBatch, query, where, limit, getDocs, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { OnlineGame, OnlinePlayer, Card, Suit, Rank } from '@/types/game';

// --- Game Creation and Management ---

export async function createGame(host: User, isPrivate: boolean): Promise<string> {
    const gameRef = doc(collection(db, 'games'));

    const hostPlayer: OnlinePlayer = {
        uid: host.uid,
        name: host.displayName || 'Anonymous',
        photoURL: host.photoURL,
        isBot: false,
        seat: 0,
        score: 0,
        tricksWon: 0,
    };

    const newGame: OnlineGame = {
        id: gameRef.id,
        hostId: host.uid,
        status: 'waiting',
        players: [hostPlayer],
        settings: {
            isPrivate,
            winningScore: 50,
        },
        currentRound: 1,
        currentTrick: 1,
        currentTurnSeat: 0,
        trickSuit: null,
        cardsOnTable: [],
        calls: {},
    };

    await setDoc(gameRef, newGame);

    if (!isPrivate) {
        const lobbyRef = doc(db, 'lobby', gameRef.id);
        await setDoc(lobbyRef, { gameId: gameRef.id, playerCount: 1 });
    }

    return gameRef.id;
}

export async function findAndJoinPublicGame(user: User): Promise<string> {
    const lobbyQuery = query(collection(db, 'lobby'), where('playerCount', '<', 4), limit(1));
    const lobbySnapshot = await getDocs(lobbyQuery);

    if (lobbySnapshot.empty) {
        // No public games waiting, create a new one
        return createGame(user, false);
    } else {
        // Found a game, attempt to join
        const gameToJoin = lobbySnapshot.docs[0];
        const gameId = gameToJoin.id;
        await joinGame(gameId, user);
        return gameId;
    }
}


export async function joinGame(gameId: string, user: User): Promise<void> {
    const gameRef = doc(db, 'games', gameId);

    try {
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) {
                throw new Error("Game not found!");
            }

            const game = gameDoc.data() as OnlineGame;
            const isAlreadyPlayer = game.players.some(p => p.uid === user.uid);

            if (isAlreadyPlayer) return; // Already in game, do nothing

            if (game.players.length >= 4) {
                throw new Error("Game is full!");
            }
            if (game.status !== 'waiting') {
                throw new Error("Game has already started!");
            }

            const newPlayer: OnlinePlayer = {
                uid: user.uid,
                name: user.displayName || 'Anonymous',
                photoURL: user.photoURL,
                isBot: false,
                seat: game.players.length,
                score: 0,
                tricksWon: 0,
            };

            transaction.update(gameRef, {
                players: arrayUnion(newPlayer)
            });

            if (!game.settings.isPrivate) {
                 const lobbyRef = doc(db, 'lobby', gameId);
                 transaction.update(lobbyRef, { playerCount: game.players.length + 1 });
            }
        });
    } catch(e) {
        console.error("Failed to join game:", e);
        throw e;
    }
}


// --- Gameplay Actions ---

const createDeck = (): Card[] => {
    const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    suits.forEach(suit => {
        ranks.forEach((rank, index) => {
            deck.push({ suit, rank, value: index + 2 });
        });
    });
    return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

export async function dealCardsAndStartGame(gameId: string, hostUid: string) {
    const gameRef = doc(db, 'games', gameId);

    const gameDoc = await getDoc(gameRef);
    if (!gameDoc.exists()) throw new Error("Game not found");
    
    const game = gameDoc.data() as OnlineGame;
    if (game.hostId !== hostUid) throw new Error("Only the host can start the game.");
    if (game.players.length !== 4) throw new Error("Need 4 players to start.");
    if (game.status !== 'waiting') throw new Error("Game has already started.");
    
    const deck = shuffleDeck(createDeck());
    const hands: Record<string, Card[]> = {};
    game.players.forEach(p => {
        hands[p.uid] = [];
    });

    for (let i = 0; i < 52; i++) {
        const playerIndex = i % 4;
        const playerUID = game.players[playerIndex].uid;
        hands[playerUID].push(deck[i]);
    }
    
    const batch = writeBatch(db);

    // Set hands in private subcollection
    for (const player of game.players) {
        const handRef = doc(db, 'games', gameId, 'private', player.uid);
        // Sort hand for consistent display
        const sortedHand = hands[player.uid].sort((a,b) => b.value - a.value).sort((a,b) => a.suit.localeCompare(b.suit));
        batch.set(handRef, { hand: sortedHand });
    }

    // Update main game doc
    batch.update(gameRef, {
        status: 'playing', // In a real game, this would go to 'calling' first
        currentTurnSeat: 0,
    });
    
    // If it was a public game, remove it from the lobby
    if (!game.settings.isPrivate) {
        const lobbyRef = doc(db, 'lobby', gameId);
        batch.delete(lobbyRef);
    }
    
    await batch.commit();
}
