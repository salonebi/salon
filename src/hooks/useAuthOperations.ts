// src/hooks/useAuthOperations.ts

'use client';

import { useState } from 'react';
import { getAuth, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthOperations, UserProfile } from '../types'; // FIX: Import UserProfile instead of UserProfileCallableResult
import { AppRoutes } from '@/routes/appRoutes';
import { toast } from 'sonner';

import { ensureUserProfile } from '../lib/authService';

const googleProvider = new GoogleAuthProvider();

/**
 * Custom hook for handling Google Sign-In and Sign-Out operations.
 * Provides loading state and error messages for these operations via toasts.
 */
export const useAuthOperations = (): AuthOperations => {
    const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const router = require('next/navigation').useRouter();

    // Google Sign-In
    const googleSignIn = async (): Promise<void> => {
        setLoadingAuth(true);
        setAuthError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (user) {
                // FIX: Type 'profile' as UserProfile, not UserProfileCallableResult
                const profile: UserProfile = await ensureUserProfile();

                let redirectPath = AppRoutes.USER_DASHBOARD; // Default redirect path

                // Determine redirection based on the role returned by the Cloud Function
                switch (profile.role) {
                    case 'admin':
                        redirectPath = AppRoutes.ADMIN_DASHBOARD;
                        break;
                    case 'salon':
                        redirectPath = AppRoutes.SALON_DASHBOARD;
                        break;
                    case 'user':
                    default:
                        redirectPath = AppRoutes.USER_DASHBOARD;
                        break;
                }

                toast.success("Signed in with Google successfully!");
                router.push(redirectPath);

            } else {
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