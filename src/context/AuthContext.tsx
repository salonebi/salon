// src/context/AuthContext.tsx

'use client'; // This directive marks the file as a client component

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, createUserProfile } from '../lib/authService'; // Import authService functions
import { AuthContextType, UserRole } from '../types'; // Import types
import { toast } from 'sonner'; // Import toast from sonner

// Create the AuthContext with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthContextProvider');
    }
    return context;
};

// AuthProvider component to wrap your application
interface AuthContextProviderProps {
    children: ReactNode;
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // For initial auth state loading

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                console.log("onAuthStateChanged: User detected:", currentUser.uid);
                setUser(currentUser);
                setUserId(currentUser.uid);

                try {
                    let profile = await getUserProfile(currentUser.uid);

                    if (!profile) {
                        console.log("onAuthStateChanged: User profile not found, creating new profile.");
                        // If no profile exists, create a new one with 'user' role
                        profile = await createUserProfile(currentUser, 'user');
                        toast.success("Welcome! Your basic user profile has been created.");
                    } else {
                        console.log("onAuthStateChanged: User profile found:", profile);
                    }
                    setUserRole(profile.role);
                } catch (error) {
                    console.error("AuthContext: Error managing user profile:", error);
                    toast.error(`Failed to load or create user profile: ${(error as Error).message}`);
                    setUserRole('user'); // Fallback to 'user' role on error
                }
            } else {
                console.log("onAuthStateChanged: No user detected.");
                // No user is signed in, attempt anonymous sign-in
                // This ensures a userId is always available for initial data storage
                // Only sign in anonymously if no user object exists from previous session
                // This prevents re-signing in anonymously if a user just signed out.
                if (userId === null && !loading) { // Check if userId is null and not already loading
                    console.log("AuthContext: Attempting anonymous sign-in...");
                    try {
                        await signInAnonymously(auth);
                        toast.info("Signing in anonymously...");
                    } catch (error) {
                        console.error("AuthContext: Error during anonymous sign-in:", error);
                        toast.error(`Anonymous sign-in failed: ${(error as Error).message}`);
                        setUserId(null);
                        setUserRole(null);
                    }
                } else if (userId !== null && !currentUser) {
                    // If a user was previously authenticated and just signed out, clear state
                    console.log("AuthContext: User signed out, clearing state.");
                    setUser(null);
                    setUserId(null);
                    setUserRole(null);
                }
            }
            setLoading(false); // Authentication state has been determined
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [userId, loading]); // Added userId and loading to dependencies for more precise anonymous sign-in logic

    const value: AuthContextType = {
        user,
        userId,
        userRole,
        loading,
        setUserRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                    <div className="text-xl font-semibold text-gray-700">Loading authentication...</div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};