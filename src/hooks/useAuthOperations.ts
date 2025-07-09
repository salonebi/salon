// src/hooks/useAuthOperations.ts

'use client';

import { useState } from 'react';
import { getAuth, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase'; // Assuming auth is exported from firebase config
import { AuthOperations } from '../types'; // Adjusted path
import { toast } from 'sonner';

const googleProvider = new GoogleAuthProvider();

/**
 * Custom hook for handling Google Sign-In and Sign-Out operations.
 * Provides loading state and error messages for these operations via toasts.
 */
export const useAuthOperations = (): AuthOperations => {
    const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // Google Sign-In
    const googleSignIn = async (): Promise<void> => {
        setLoadingAuth(true);
        setAuthError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            toast.success("Signed in with Google successfully!");
        } catch (error: any) {
            console.error("Error during Google Sign-In:", error);
            let errorMessage = "Authentication failed. Please try again.";
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "Sign-in process cancelled.";
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = "Another sign-in request is in progress. Please wait.";
            }
            toast.error(errorMessage);
            setAuthError(errorMessage);
        } finally {
            setLoadingAuth(false);
        }
    };

    // Sign Out
    const signOutUser = async (): Promise<void> => {
        setLoadingAuth(true);
        setAuthError(null);
        try {
            await signOut(auth);
            toast.info("You have been signed out.");
        } catch (error: any) {
            console.error("Error during sign out:", error);
            const errorMessage = `Sign out failed: ${error.message}`;
            toast.error(errorMessage);
            setAuthError(errorMessage);
        } finally {
            setLoadingAuth(false);
        }
    };

    return {
        googleSignIn,
        signOutUser,
        loadingAuth,
        authError,
    };
};
