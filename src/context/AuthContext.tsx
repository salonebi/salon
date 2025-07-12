// src/context/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ensureUserProfile } from '../lib/authService';
import { AuthContextType, UserRole, UserProfile } from '../types'; // Import UserProfile
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
                setUser(currentUser);
                setUserId(currentUser.uid);

                try {
                    // FIX: Type 'profile' as UserProfile, not UserProfileCallableResult
                    const profile: UserProfile = await ensureUserProfile();

                    console.log("AuthContext: Profile managed for user:", currentUser.uid);

                    setUserRole(profile.role);

                } catch (error) {
                    console.error("AuthContext: Critical error managing user profile:", error);
                    toast.error(`Profile loading/creation failed: ${(error as Error).message}. Signing out for safety.`);
                    await signOut(auth);
                }
            } else {
                setUser(null);
                setUserId(null);
                setUserRole(null);
            }

            if (loading) {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [loading]);

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