// src/lib/authService.ts

import { User } from 'firebase/auth'; // User is still needed for type hints in ensureUserProfile
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
// Removed 'doc' and 'setDoc' imports as createUserProfile is removed
// Removed 'db' import as direct Firestore access for profiles is centralized in functions
import { auth, app } from './firebase'; // Only import auth and app now

import {
    UserProfile,
    UserRole, // UserRole is still needed for updateUserRole
    GetUserProfileCallableData,
    GetUserProfileCallableResult,
    UpdateUserProfileCallableData,
    UpdateUserProfileCallableResult,
    GetAllUserProfilesCallableResult,
    EnsureUserProfileCallableResult,
    UserProfileCallableResult // NEW: Now correctly imported
} from '../types';

const storage = getStorage();
const functions = getFunctions(app);

const getAuthUserProfileCallable = httpsCallable<GetUserProfileCallableData, GetUserProfileCallableResult>(functions, 'getAuthUserProfile');
const updateAuthUserProfileCallable = httpsCallable<UpdateUserProfileCallableData, UpdateUserProfileCallableResult>(functions, 'updateAuthUserProfile');
const getAllUserProfilesCallable = httpsCallable<void, GetAllUserProfilesCallableResult>(functions, 'getAllUserProfiles');
const ensureUserProfileCallable = httpsCallable<void, EnsureUserProfileCallableResult>(functions, 'ensureUserProfile');


/**
 * Fetches a user's profile using a callable Cloud Function.
 * This is now primarily for fetching *existing* profiles, not initial creation.
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const result = await getAuthUserProfileCallable({ uid: userId });
        const profileData = result.data;

        if (profileData) {
            return {
                ...profileData,
                createdAt: new Date(profileData.createdAt),
                updatedAt: profileData.updatedAt ? new Date(profileData.updatedAt) : undefined,
            } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile via Cloud Function:", error);
        throw error;
    }
};

/**
 * Ensures a user profile exists and returns it.
 * This function now calls the Cloud Function to handle creation/retrieval.
 * This replaces the old client-side createUserProfile.
 */
export const ensureUserProfile = async (): Promise<UserProfile> => {
    try {
        const result = await ensureUserProfileCallable();
        const profileData = result.data;
        if (!profileData) {
            throw new Error("Failed to ensure user profile: no data returned.");
        }
        return {
            ...profileData,
            createdAt: new Date(profileData.createdAt),
            updatedAt: profileData.updatedAt ? new Date(profileData.updatedAt) : undefined,
        } as UserProfile;
    } catch (error) {
        console.error("Error ensuring user profile via Cloud Function:", error);
        throw error;
    }
};

// REMOVED: The old createUserProfile function is now gone as its logic is in ensureUserProfile CF.
/*
export const createUserProfile = async (user: User, defaultRole: UserRole): Promise<UserProfile> => {
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
    const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);

    const newUserProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName ?? 'New User',
        email: user.email ?? null,
        role: defaultRole,
        createdAt: new Date(),
        photoURL: user.photoURL ?? null,
    };

    try {
        await setDoc(userProfileRef, newUserProfile, { merge: true });
        return newUserProfile;
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};
*/


/**
 * Updates a user's profile using a callable Cloud Function.
 * Handles photo upload client-side, then passes the URL to the function.
 */
export const updateUserProfile = async (
    updates: UpdateUserProfileCallableData,
    newPhoto?: File | null
): Promise<void> => {
    const updatePayload: UpdateUserProfileCallableData = { ...updates };

    if (newPhoto) {
        const userIdForPhoto = updates.targetUid || auth.currentUser?.uid;
        if (!userIdForPhoto) {
            throw new Error("User ID is required to upload a photo.");
        }
        const photoRef = ref(storage, `profile-photos/${userIdForPhoto}/${newPhoto.name}`);
        await uploadBytes(photoRef, newPhoto);
        updatePayload.photoURL = await getDownloadURL(photoRef);
    }

    try {
        await updateAuthUserProfileCallable(updatePayload);
    } catch (error) {
        console.error("Error updating user profile via Cloud Function:", error);
        throw error;
    }
};

/**
 * Updates a user's role in Firestore via the updateAuthUserProfile callable function.
 */
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
    const updatePayload: UpdateUserProfileCallableData = {
        targetUid: userId,
        role: newRole,
    };
    try {
        await updateAuthUserProfileCallable(updatePayload);
    } catch (error) {
        console.error(`Error updating role for user ${userId} via Cloud Function:`, error);
        throw error;
    }
};

/**
 * Fetches all user profiles from Firestore for the admin dashboard via a callable Cloud Function.
 */
export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
    try {
        const result = await getAllUserProfilesCallable();
        const profilesData = result.data;

        return profilesData.map(profile => ({
            ...profile,
            createdAt: new Date(profile.createdAt),
            updatedAt: profile.updatedAt ? new Date(profile.updatedAt) : undefined,
        })) as UserProfile[];
    } catch (error) {
        console.error("Error fetching all user profiles via Cloud Function:", error);
        throw error;
    }
};