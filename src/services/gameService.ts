import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { GameState } from '@/types/game';

export async function saveGameResult(game: GameState) {
  if (!game.id) {
    console.error("Game must have an ID to be saved.");
    return;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isGameActive, ...gameData } = game;

  try {
    const docRef = await addDoc(collection(db, "games"), {
      ...gameData,
      finishedAt: serverTimestamp(),
    });
    console.log("Game result saved with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document. Have you configured your .env.local file with your Firebase credentials?", e);
  }
}

export async function getPastGames(): Promise<GameState[]> {
  try {
    const gamesCollection = collection(db, "games");
    const q = query(gamesCollection, orderBy("finishedAt", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    const games: GameState[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const finishedAtTimestamp = data.finishedAt as Timestamp | null;
      games.push({
        ...(data as Omit<GameState, 'id' | 'finishedAt'>),
        id: doc.id,
        finishedAt: finishedAtTimestamp ? finishedAtTimestamp.toDate().toISOString() : undefined,
      });
    });
    return games;
  } catch (e) {
    console.error("Error fetching past games:", e);
    return [];
  }
}
