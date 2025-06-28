import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { GameState } from '@/types/game';

export async function saveGameResult(game: GameState) {
  if (!game.id) {
    console.error("Game must have an ID to be saved.");
    return;
  }
  
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
