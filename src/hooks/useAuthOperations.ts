// src/hooks/useAuthOperations.ts

'use client';

import { useState } from 'react';
import { getAuth, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { auth, db } from '../lib/firebase'; // Assuming auth and db are exported from firebase config
import { AuthOperations } from '../types'; // Adjusted path
import { toast } from 'sonner';
import { useRouter } from 'next/navigation'; // Import useRouter for redirection
import { AppRoutes } from '@/routes/appRoutes'; // Import AppRoutes for consistent routing

const googleProvider = new GoogleAuthProvider();

// Define __app_id for Firestore path construction, similar to AuthContext
declare const __app_id: string | undefined;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

/**
 * Custom hook for handling Google Sign-In and Sign-Out operations.
 * Provides loading state and error messages for these operations via toasts.
 */
export const useAuthOperations = (): AuthOperations => {
    const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const router = useRouter(); // Initialize the router

    // Google Sign-In
    // This function now handles role-based redirection internally
    const googleSignIn = async (): Promise<void> => {
        setLoadingAuth(true);
        setAuthError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (user) {
                // Fetch user's profile to determine their role
                const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
                const userProfileSnap = await getDoc(userProfileRef);

                let redirectPath = AppRoutes.USER_DASHBOARD; // Default redirect path

                if (userProfileSnap.exists()) {
                    const userData = userProfileSnap.data();
                    const userRole = userData.role;

                    switch (userRole) {
                        case 'admin':
                            redirectPath = AppRoutes.ADMIN_DASHBOARD;
                            break;
                        case 'user':
                        default:
                            redirectPath = AppRoutes.USER_DASHBOARD;
                            break;
                    }
                } else {
                    // If profile doesn't exist (e.g., first-time sign-in),
                    // the AuthContext should handle creating a default 'user' profile.
                    // We'll still redirect to the user dashboard as a fallback.
                    console.warn("User profile not found after sign-in. Defaulting to user dashboard.");
                }

                toast.success("Signed in with Google successfully!");
                router.push(redirectPath);
            } else {
                // This case should ideally not happen with signInWithPopup
                throw new Error("User not found after sign-in popup.");
            }
        } catch (error: any) {
            console.error("Error during Google Sign-In:", error);
            let errorMessage = "Authentication failed. Please try again.";
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "Sign-in process cancelled.";
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = "Another sign-in request is in progress. Please wait.";
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = "An account with this email already exists using a different sign-in method.";
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
            // After sign out, redirect to home or login page
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
