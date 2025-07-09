// src/context/AuthContext.tsx

'use client'; 

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth'; // Removed signInAnonymously
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
    const [loading, setLoading] = useState<boolean>(true);

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
                        profile = await createUserProfile(currentUser, 'user');
                        toast.success("Welcome! Your basic user profile has been created.");
                    } else {
                        console.log("onAuthStateChanged: User profile found:", profile);
                    }
                    setUserRole(profile.role);
                } catch (error) {
                    console.error("AuthContext: Error managing user profile:", error);
                    toast.error(`Failed to load or create user profile: ${(error as Error).message}`);
                    setUserRole(null); // Fallback to null on error
                }
            } else {
                // If no user, set all user-related states to null
                console.log("onAuthStateChanged: No user detected, clearing state.");
                setUser(null);
                setUserId(null);
                setUserRole(null);
            }
            setLoading(false); 
        });

        return () => unsubscribe();
    }, []); // Removed dependencies to run only once on mount

    const value: AuthContextType = {
        user,
        userId,
        userRole,
        loading,
        setUserRole, // This is still useful for potential role changes in the future
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