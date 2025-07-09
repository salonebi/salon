// src/lib/authService.ts

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth'; // Import Firebase User type
import { db } from './firebase'; // Import your Firestore instance
import { UserProfile, UserRole } from '../types'; // Import your types

/**
 * Fetches a user's profile from Firestore.
 * @param userId The UID of the user.
 * @returns A UserProfile object or null if not found.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
    const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);

    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

/**
 * Creates a new user profile in Firestore.
 * This is typically called when a user first signs in (e.g., via Google)
 * and no profile exists yet.
 * @param user The Firebase User object.
 * @param defaultRole The default role to assign (e.g., 'user').
 * @returns The created UserProfile object.
 */
export const createUserProfile = async (user: User, defaultRole: UserRole): Promise<UserProfile> => {
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
    const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);

    const newUserProfile: UserProfile = {
        userId: user.uid,
        name: user.displayName || 'New User',
        email: user.email || '',
        role: defaultRole,
        createdAt: new Date().toISOString(),
    };

    try {
        await setDoc(userProfileRef, newUserProfile);
        console.log("New user profile created in Firestore with role:", defaultRole);
        return newUserProfile;
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error; // Re-throw to be handled by calling context/component
    }
};

/**
 * Updates a user's role in Firestore. This would primarily be used by an Admin.
 * @param userId The UID of the user.
 * @param newRole The new role to assign.
 */
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
    const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);

    try {
        await setDoc(userProfileRef, { role: newRole }, { merge: true });
        console.log(`User ${userId} role updated to ${newRole}`);
    } catch (error) {
        console.error(`Error updating role for user ${userId}:`, error);
        throw error;
    }
};
