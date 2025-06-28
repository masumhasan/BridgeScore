"use server";

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

export async function createUserProfile(user: User) {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    // If user already has a profile, don't overwrite their custom displayName
    // on subsequent logins. Only update fields that might change.
    if (docSnap.exists()) {
        await updateDoc(userRef, {
            photoURL: user.photoURL,
        });
        return;
    }

    // Otherwise, create a new profile
    const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName, // This can be from Google, or null for email
        photoURL: user.photoURL
    };
    await setDoc(userRef, profile, { merge: true });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        return null;
    }
}

// Check if a username is unique, excluding the current user.
export async function checkUsernameUniqueness(username: string, currentUserId: string): Promise<boolean> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("displayName", "==", username), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return true; // Username is not taken at all.
    }

    const foundUser = querySnapshot.docs[0];
    return foundUser.id === currentUserId; // It's unique if the only user found is the current user.
}

// Update the user profile document in Firestore.
export async function updateUserFirestoreProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
}
