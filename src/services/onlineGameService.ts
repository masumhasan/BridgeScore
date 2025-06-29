
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, writeBatch, query, where, limit, getDocs, updateDoc, arrayUnion, runTransaction, type DocumentReference } from 'firebase/firestore';
import type { OnlineGame, OnlinePlayer, Card, Suit, Rank, PlayedCard } from '@/types/game';

type PlayerInfo = {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
};

const createDeck = (): Card[] => {
    const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];
    const suitOrder = { spades: 4, hearts: 3, diamonds: 2, clubs: 1 };
    suits.forEach(suit => {
        ranks.forEach((rank, index) => {
            deck.push({ suit, rank, value: index + 2, suitValue: suitOrder[suit] });
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


// --- Game Creation and Management ---

export async function createGame(host: PlayerInfo, isPrivate: boolean): Promise<string> {
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

export async function createGameWithBots(host: PlayerInfo): Promise<string> {
    const gameRef = doc(collection(db, 'games'));
    const batch = writeBatch(db);

    const hostPlayer: OnlinePlayer = {
        uid: host.uid,
        name: host.displayName || `Guest ${Math.floor(Math.random() * 1000)}`,
        photoURL: host.photoURL,
        isBot: false,
        seat: 0,
        score: 0,
        tricksWon: 0,
    };

    const botPlayers: OnlinePlayer[] = [
        { uid: 'bot-1', name: 'Bot Alpha', photoURL: null, isBot: true, seat: 1, score: 0, tricksWon: 0 },
        { uid: 'bot-2', name: 'Bot Bravo', photoURL: null, isBot: true, seat: 2, score: 0, tricksWon: 0 },
        { uid: 'bot-3', name: 'Bot Charlie', photoURL: null, isBot: true, seat: 3, score: 0, tricksWon: 0 },
    ];
    
    const allPlayers = [hostPlayer, ...botPlayers];

    // --- Deal cards ---
    const deck = shuffleDeck(createDeck());
    const hands: Record<string, Card[]> = {};
    allPlayers.forEach(p => {
        hands[p.uid] = [];
    });

    for (let i = 0; i < 52; i++) {
        const playerSeat = i % 4;
        const playerUID = allPlayers.find(p => p.seat === playerSeat)!.uid;
        hands[playerUID].push(deck[i]);
    }

    // Set hands in private subcollection
    for (const player of allPlayers) {
        const handRef = doc(db, 'games', gameRef.id, 'private', player.uid);
        const sortedHand = hands[player.uid].sort((a,b) => {
            if (a.suitValue !== b.suitValue) {
                return b.suitValue - a.suitValue;
            }
            return b.value - a.value;
        });
        batch.set(handRef, { hand: sortedHand });
    }

    // --- Create Game Object ---
    const newGame: OnlineGame = {
        id: gameRef.id,
        hostId: host.uid,
        status: 'playing', // Start playing immediately
        players: allPlayers,
        settings: {
            isPrivate: true,
            winningScore: 50,
        },
        currentRound: 1,
        currentTrick: 1,
        currentTurnSeat: 0, // Host starts
        trickSuit: null,
        cardsOnTable: [],
        calls: {},
    };

    batch.set(gameRef, newGame);
    
    await batch.commit();

    return gameRef.id;
}

export async function findAndJoinPublicGame(user: PlayerInfo): Promise<string> {
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


export async function joinGame(gameId: string, user: PlayerInfo): Promise<void> {
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
        // Deal cards one by one to each player by seat order
        const playerSeat = i % 4;
        const playerUID = game.players.find(p => p.seat === playerSeat)!.uid;
        hands[playerUID].push(deck[i]);
    }
    
    const batch = writeBatch(db);

    // Set hands in private subcollection
    for (const player of game.players) {
        const handRef = doc(db, 'games', gameId, 'private', player.uid);
        // Sort hand for consistent display: by suit, then by rank value
        const sortedHand = hands[player.uid].sort((a,b) => {
            if (a.suitValue !== b.suitValue) {
                return b.suitValue - a.suitValue;
            }
            return b.value - a.value;
        });
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


export async function playCard(gameId: string, userId: string, card: Card) {
    const gameRef = doc(db, 'games', gameId);
    const handRef = doc(db, 'games', gameId, 'private', userId);

    await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        const handDoc = await transaction.get(handRef);

        if (!gameDoc.exists() || !handDoc.exists()) {
            throw new Error("Game or player hand not found.");
        }

        const game = gameDoc.data() as OnlineGame;
        const player = game.players.find(p => p.uid === userId);
        const hand = handDoc.data()?.hand as Card[];

        // --- Validation ---
        if (!player) throw new Error("Player not found in this game.");
        if (game.status !== 'playing') throw new Error("Not in playing phase.");
        if (game.currentTurnSeat !== player.seat) throw new Error("Not your turn.");
        if (!hand.some(c => c.rank === card.rank && c.suit === card.suit)) {
            throw new Error("Card not in hand.");
        }
        if (game.trickSuit) {
            const hasSuit = hand.some(c => c.suit === game.trickSuit);
            if (hasSuit && card.suit !== game.trickSuit) {
                throw new Error("Must follow suit if you can.");
            }
        }

        // --- Update State ---
        const newHand = hand.filter(c => !(c.rank === card.rank && c.suit === card.suit));
        transaction.update(handRef, { hand: newHand });

        const newCardOnTable: PlayedCard = { seat: player.seat, card };
        const updatedCardsOnTable = [...game.cardsOnTable, newCardOnTable];
        
        const updates: Partial<OnlineGame> = {
            cardsOnTable: updatedCardsOnTable,
            currentTurnSeat: (game.currentTurnSeat + 1) % 4,
            trickSuit: game.trickSuit || card.suit,
        };

        // --- End of Trick Logic ---
        if (updatedCardsOnTable.length === 4) {
            // Call Bridge rules: Spades are trump
            const trumpCards = updatedCardsOnTable.filter(c => c.card.suit === 'spades');
            
            let winningCard: PlayedCard;

            if (trumpCards.length > 0) {
                // If there are trumps, the highest trump wins
                winningCard = trumpCards.sort((a, b) => b.card.value - a.card.value)[0];
            } else {
                // Otherwise, the highest card of the lead suit wins
                winningCard = updatedCardsOnTable
                    .filter(c => c.card.suit === updates.trickSuit)
                    .sort((a, b) => b.card.value - a.card.value)[0];
            }
            
            const winner = game.players.find(p => p.seat === winningCard.seat)!;
            
            updates.status = 'trick_scoring';
            updates.lastTrickWinnerSeat = winner.seat;
            updates.currentTurnSeat = winner.seat; // Winner leads next trick

            const updatedPlayers = game.players.map(p => 
                p.uid === winner.uid ? { ...p, tricksWon: p.tricksWon + 1 } : p
            );
            updates.players = updatedPlayers;
        }

        transaction.update(gameRef, updates);
    });
}

export async function startNextTrick(gameId: string) {
    const gameRef = doc(db, 'games', gameId);

    await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw new Error("Game not found.");

        const game = gameDoc.data() as OnlineGame;
        if (game.status !== 'trick_scoring') return; // Avoid race conditions

        const updates: Partial<OnlineGame> = {
            status: 'playing',
            cardsOnTable: [],
            trickSuit: null,
            currentTrick: game.currentTrick + 1,
        };

        // End of round logic
        if (updates.currentTrick! > 13) {
            updates.status = 'round_scoring';
            // TODO: Implement round scoring logic and transition to 'calling' or 'finished'
        }

        transaction.update(gameRef, updates);
    });
}
