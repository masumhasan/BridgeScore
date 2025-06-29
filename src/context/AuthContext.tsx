"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, type User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInAnonymously } from 'firebase/auth';
import { auth, db, app } from '@/lib/firebase';
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserProfile, updateUserFirestoreProfile, checkUsernameUniqueness } from '@/services/userService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signUpWithEmail: (email:string, password:string) => Promise<any>;
    loginWithEmail: (email:string, password:string) => Promise<any>;
    logout: () => Promise<void>;
    updateUsername: (newDisplayName: string) => Promise<{ success: boolean; message: string }>;
    signInAsGuest: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Initialize App Check
        if (typeof window !== 'undefined') {
            try {
                initializeAppCheck(app, {
                    provider: new ReCaptchaV3Provider('6LfJlHErAAAAAA_G-5_kCMD4jtLUiGrBV_WUbVnu'),
                    isTokenAutoRefreshEnabled: true
                });
            } catch (e) {
                console.error("Failed to initialize App Check", e);
            }
        }

        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            await createUserProfile(result.user);
        } catch (error) {
            console.error("Error signing in with Google: ", error);
            throw error;
        }
    };
    
    const signUpWithEmail = async (email:string, password:string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await createUserProfile(result.user);
            return result;
        } catch(error) {
            console.error("Error signing up with email: ", error);
            throw error;
        }
    }

    const loginWithEmail = async (email:string, password:string) => {
        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } catch(error) {
            console.error("Error logging in with email: ", error);
            throw error;
        }
    }

    const logout = async () => {
        await signOut(auth);
        router.push('/');
    };
    
    const signInAsGuest = async (): Promise<User> => {
        try {
            const userCredential = await signInAnonymously(auth);
            const guestUser = userCredential.user;

            // We need to ensure the user has a profile in Firestore and a display name in Auth
            // for downstream functions to work correctly.
            const userProfileRef = doc(db, 'users', guestUser.uid);
            const userProfileSnap = await getDoc(userProfileRef);

            if (!userProfileSnap.exists()) {
                const tempName = `Guest ${Math.floor(Math.random() * 1000)}`;
                
                // This updates the user profile in Firebase Auth.
                await updateProfile(guestUser, { displayName: tempName });

                // This creates the corresponding user profile in Firestore.
                // We pass the explicit values to avoid race conditions with the user object updating.
                await setDoc(userProfileRef, {
                    uid: guestUser.uid,
                    email: guestUser.email,
                    displayName: tempName,
                    photoURL: guestUser.photoURL
                });
            }
            
            // Return the user object from the credential. It's the most up-to-date reference we have.
            // Downstream functions can use this object immediately.
            return guestUser;

        } catch (error) {
            console.error("Error signing in as guest:", error);
            throw error;
        }
    };

    const updateUsername = async (newDisplayName: string): Promise<{ success: boolean; message: string }> => {
        if (!auth.currentUser) {
            return { success: false, message: "You must be logged in to update your profile." };
        }
        
        try {
            const isUnique = await checkUsernameUniqueness(newDisplayName, auth.currentUser.uid);
            if (!isUnique) {
                return { success: false, message: "Username is already taken. Please choose another." };
            }

            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, { displayName: newDisplayName });
            
            // Update Firestore profile
            await updateUserFirestoreProfile(auth.currentUser.uid, { displayName: newDisplayName });
            
            // Manually trigger a refresh of the user object to reflect changes immediately.
            setUser(auth.currentUser);

            return { success: true, message: "Username updated successfully!" };

        } catch (error) {
            console.error("Error updating username: ", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            return { success: false, message: errorMessage };
        }
    };

    const value = { user, loading, signInWithGoogle, logout, signUpWithEmail, loginWithEmail, updateUsername, signInAsGuest };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
