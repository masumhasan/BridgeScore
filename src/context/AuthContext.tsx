"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, type User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/services/userService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signUpWithEmail: (email:string, password:string) => Promise<any>;
    loginWithEmail: (email:string, password:string) => Promise<any>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
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

    const value = { user, loading, signInWithGoogle, logout, signUpWithEmail, loginWithEmail };

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
