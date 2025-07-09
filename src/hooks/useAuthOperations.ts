
// src/hooks/useAuthOperations.ts

'use client';

import { useState } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { googleProvider, signInWithPopup } from '../lib/firebase';
import { AuthOperations } from '../types';
import { toast } from 'sonner'; // Import toast from sonner

/**
 * Custom hook for handling Google Sign-In and Sign-Out operations.
 * Provides loading state and error messages for these operations via toasts.
 */
export const useAuthOperations = (): AuthOperations => {
    const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
    const [authError, setAuthError] = useState<string | null>(null); // Keep for potential specific component handling if needed

    // Google Sign-In
    const googleSignIn = async () => {
        setLoadingAuth(true);
        setAuthError(null); // Clear previous errors
        try {
            await signInWithPopup(getAuth(), googleProvider);
            toast.success("Signed in with Google successfully!"); // Success toast
        } catch (error: any) {
            console.error("Error during Google Sign-In:", error);
            let errorMessage = "Authentication failed. Please try again.";
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "Sign-in process cancelled.";
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = "Another sign-in request is in progress. Please wait.";
            }
            toast.error(errorMessage); // Error toast
            setAuthError(errorMessage); // Set error state for component to react if needed
            throw error; // Re-throw to allow component to handle specific UI feedback
        } finally {
            setLoadingAuth(false);
        }
    };

    // Sign Out
    const signOutUser = async () => {
        setLoadingAuth(true);
        setAuthError(null); // Clear previous errors
        try {
            await signOut(getAuth());
            toast.info("You have been signed out."); // Info toast for sign out
        } catch (error: any) {
            console.error("Error during sign out:", error);
            const errorMessage = `Sign out failed: ${error.message}`;
            toast.error(errorMessage); // Error toast
            setAuthError(errorMessage);
            throw error;
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
