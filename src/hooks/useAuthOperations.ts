// src/hooks/useAuthOperations.ts

'use client';

import { useState } from 'react';
import { getAuth, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthOperations, UserProfile, UserRole } from '../types'; // Import UserProfile and UserRole
import { AppRoutes } from '@/routes/appRoutes';
import { toast } from 'sonner';

// Import callable function from Firebase Client SDK
import { getFunctions, httpsCallable } from 'firebase/functions';

const googleProvider = new GoogleAuthProvider();
const functions = getFunctions(); // Initialize Firebase Functions client SDK

// Reference to your callable Cloud Function
const ensureUserProfileCallable = httpsCallable<void, UserProfile>(functions, 'ensureUserProfile');


/**
 * Custom hook for handling Google Sign-In and Sign-Out operations.
 * Provides loading state and error messages for these operations via toasts.
 */
export const useAuthOperations = (): AuthOperations => {
    const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const router = require('next/navigation').useRouter(); // Assuming this is correct for Next.js 13+ app router

    // Google Sign-In
    const googleSignIn = async (): Promise<void> => {
        setLoadingAuth(true);
        setAuthError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (user) {
                // Call the Cloud Function to ensure/update the user profile in Firestore
                const profile = (await ensureUserProfileCallable()).data; // .data contains the result

                let redirectPath = AppRoutes.USER_DASHBOARD; // Default redirect path

                // Determine redirection based on the role returned by the Cloud Function
                switch (profile.role) {
                    case 'admin':
                        redirectPath = AppRoutes.ADMIN_DASHBOARD; // Redirect to admin dashboard
                        break;
                    case 'customer': // This now covers regular users, salon owners, and stylists
                    default:
                        // You might add more specific logic here later based on `ownedSalons` or `associatedSalons`
                        // For example: if (profile.ownedSalons && profile.ownedSalons.length > 0) redirectPath = AppRoutes.SALON_DASHBOARD;
                        // For now, all 'customer' roles go to the general user dashboard.
                        redirectPath = AppRoutes.USER_DASHBOARD;
                        break;
                }

                toast.success("Signed in with Google successfully!");
                router.push(redirectPath);

            } else {
                throw new Error("User not found after sign-in popup.");
            }
        } catch (error: any) {
            console.error("Error during Google Sign-In or profile setup:", error);
            let errorMessage = "Authentication failed. Please try again.";
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "Sign-in process cancelled.";
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = "Another sign-in request is in progress. Please wait.";
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = "An account with this email already exists using a different sign-in method.";
            } else if (error.code === 'functions/internal') { // Catch errors from Cloud Function
                 errorMessage = error.message || "Failed to set up user profile.";
            }
            toast.error(errorMessage);
            setAuthError(errorMessage);
        } finally {
            setLoadingAuth(false);
        }
    };

    // Sign Out (remains unchanged)
    const signOutUser = async (): Promise<void> => {
        setLoadingAuth(true);
        setAuthError(null);
        try {
            await signOut(auth);
            toast.info("You have been signed out.");
            router.push(AppRoutes.HOME);
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