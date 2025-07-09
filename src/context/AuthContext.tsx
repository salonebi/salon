// src/context/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth'; // Import signOut
import { auth } from '../lib/firebase';
import { getUserProfile, createUserProfile } from '../lib/authService';
import { AuthContextType, UserRole } from '../types';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthContextProvider');
    }
    return context;
};

interface AuthContextProviderProps {
    children: ReactNode;
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    // 'loading' represents the initial auth check. It will be true only once at the start.
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            // This listener handles all auth changes: initial load, login, logout.
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);

                try {
                    let profile = await getUserProfile(currentUser.uid);

                    if (!profile) {
                        console.log("AuthContext: Profile not found. Creating new profile for user:", currentUser.uid);
                        toast.info("Welcome! Setting up your new account...");
                        profile = await createUserProfile(currentUser, 'user');
                        toast.success("Your account has been created successfully!");
                    } else {
                        console.log("AuthContext: Profile found for user:", currentUser.uid);
                    }
                    
                    setUserRole(profile.role);

                } catch (error) {
                    console.error("AuthContext: Critical error managing user profile:", error);
                    toast.error(`Profile loading failed: ${(error as Error).message}. Signing out for safety.`);
                    // If profile fails, log the user out to prevent an inconsistent state.
                    await signOut(auth); // This will re-trigger onAuthStateChanged with `null`.
                }
            } else {
                // No user is logged in. Clear all user-related state.
                setUser(null);
                setUserId(null);
                setUserRole(null);
            }
            
            // After the first check is done (either with a user or null), mark loading as complete.
            if (loading) {
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [loading]); // Dependency on 'loading' helps manage the initial state flip.

    const value: AuthContextType = {
        user,
        userId,
        userRole,
        loading,
        setUserRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
