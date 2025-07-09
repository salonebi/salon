// src/lib/authService.ts

import { doc, getDoc, setDoc, updateDoc, Timestamp, collectionGroup, getDocs, query } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
            // FIX: Convert Firestore Timestamp to JavaScript Date object for consistency.
            if (data.createdAt && data.createdAt instanceof Timestamp) {
                data.createdAt = data.createdAt.toDate();
            }
            return data as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error; // Re-throw to be caught by the calling function
    }
};

/**
 * Creates a new user profile in Firestore.
 */
export const createUserProfile = async (user: User, defaultRole: UserRole): Promise<UserProfile> => {
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
    const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);

    // FIX: Use nullish coalescing operator (??) to be more defensive against undefined values.
    // This ensures that any undefined property from the 'user' object becomes null.
    const newUserProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName ?? 'New User',
        email: user.email ?? null,
        role: defaultRole,
        createdAt: new Date(),
        photoURL: user.photoURL ?? null,
    };

    try {
        // This write operation was causing the 400 Bad Request error, likely due to an undefined value.
        await setDoc(userProfileRef, newUserProfile);
        return newUserProfile;
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};

/**
 * Updates a user's profile in Firestore and optionally uploads a new profile photo.
 */
export const updateUserProfile = async (
    userId: string,
    updates: Partial<UserProfile>,
    newPhoto?: File | null
): Promise<void> => {
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
        await updateDoc(userProfileRef, { role: newRole });
    } catch (error) {
        console.error(`Error updating role for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Fetches all user profiles from Firestore for the admin dashboard.
 * This uses a collectionGroup query to get all 'profile' collections.
 */
export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
    // A collection group query gets all collections with a specific ID.
    // Here, we are getting every collection named 'profile'.
    const profilesCollectionGroup = collectionGroup(db, 'profile');
    const q = query(profilesCollectionGroup);

    try {
        const querySnapshot = await getDocs(q);
        const profiles: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
             // Convert Firestore Timestamp to JavaScript Date object
            if (data.createdAt && data.createdAt instanceof Timestamp) {
                data.createdAt = data.createdAt.toDate();
            }
            profiles.push(data as UserProfile);
        });
        return profiles;
    } catch (error) {
        console.error("Error fetching all user profiles:", error);
        throw error;
    }
};
