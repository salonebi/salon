// src/lib/authService.ts

import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore'; // Import updateDoc and Timestamp
import { User } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import storage functions
import { db } from './firebase';
import { UserProfile, UserRole } from '../types';

const storage = getStorage();

/**
 * Fetches a user's profile from Firestore.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
    const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);

    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Convert Firestore Timestamp to JavaScript Date object
            if (data.createdAt && data.createdAt instanceof Timestamp) {
                data.createdAt = data.createdAt.toDate();
            }
            return data as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null; // Return null on error
    }
};

/**
 * Creates a new user profile in Firestore.
 */
export const createUserProfile = async (user: User, defaultRole: UserRole): Promise<UserProfile> => {
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
    const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);

    const newUserProfile: UserProfile = {
        // FIX: Changed from `userId` to `uid` to match the UserProfile type.
        uid: user.uid,
        // FIX: Changed from `name` to `displayName` to match the UserProfile type.
        displayName: user.displayName || 'New User',
        email: user.email || null,
        role: defaultRole,
        // FIX: Changed from `toISOString()` to a Date object to match the UserProfile type.
        // Firestore will correctly store this as a Timestamp.
        createdAt: new Date(),
        photoURL: user.photoURL || null,
    };

    try {
        await setDoc(userProfileRef, newUserProfile);
        return newUserProfile;
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
};

/**
 * Updates a user's profile in Firestore and optionally uploads a new profile photo.
 */
export const updateUserProfile = async (
    userId: string,
    updates: Partial<UserProfile>,
    newPhoto?: File | null
): Promise<void> => { // Return void as we are just confirming completion
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
    const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);

    const finalUpdates: { [key: string]: any } = { ...updates };

    if (newPhoto) {
        const photoRef = ref(storage, `profile-photos/${userId}/${newPhoto.name}`);
        await uploadBytes(photoRef, newPhoto);
        finalUpdates.photoURL = await getDownloadURL(photoRef);
    }

    try {
        await updateDoc(userProfileRef, finalUpdates);
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

/**
 * Updates a user's role in Firestore.
 */
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
    const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);

    try {
        // Using `updateDoc` is slightly more idiomatic for updates.
        await updateDoc(userProfileRef, { role: newRole });
    } catch (error) {
        console.error(`Error updating role for user ${userId}:`, error);
        throw error;
    }
};
