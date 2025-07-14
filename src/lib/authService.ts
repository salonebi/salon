// src/lib/authService.ts

import { User } from 'firebase/auth'; // User is still needed for type hints in ensureUserProfile
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, app } from './firebase'; // Only import auth and app now

import {
    UserProfile,
    UserRole,
    GetUserProfileCallableData,
    GetUserProfileCallableResult,
    UpdateUserProfileCallableData,
    UpdateUserProfileCallableResult,
    GetAllUserProfilesCallableResult,
    EnsureUserProfileCallableResult,
} from '../types'; // Updated imports

const storage = getStorage(app); // Pass the app instance to getStorage
const functions = getFunctions(app); // Pass the app instance to getFunctions

// Callable function references
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
            // Convert ISO strings from CF back to Date objects for client-side use
            return {
                ...profileData,
                createdAt: new Date(profileData.createdAt) as any, // Cast to any to match Timestamp type
                lastLoginAt: new Date(profileData.lastLoginAt) as any, // Cast to any to match Timestamp type
                updatedAt: profileData.updatedAt ? new Date(profileData.updatedAt) as any : undefined,
            } as UserProfile; // Cast to UserProfile
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
        // Convert ISO strings from CF back to Date objects for client-side use
        return {
            ...profileData,
            createdAt: new Date(profileData.createdAt) as any, // Cast to any to match Timestamp type
            lastLoginAt: new Date(profileData.lastLoginAt) as any, // Cast to any to match Timestamp type
            updatedAt: profileData.updatedAt ? new Date(profileData.updatedAt) as any : undefined,
        } as UserProfile; // Cast to UserProfile
    } catch (error) {
        console.error("Error ensuring user profile via Cloud Function:", error);
        throw error;
    }
};


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
    } else if (updates.photoURL !== undefined) {
        // If photoURL is explicitly set (e.g., to null to remove it)
        updatePayload.photoURL = updates.photoURL;
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
            createdAt: new Date(profile.createdAt) as any, // Cast to any to match Timestamp type
            lastLoginAt: new Date(profile.lastLoginAt) as any, // Cast to any to match Timestamp type
            updatedAt: profile.updatedAt ? new Date(profile.updatedAt) as any : undefined,
        })) as UserProfile[]; // Cast to UserProfile[]
    } catch (error) {
        console.error("Error fetching all user profiles via Cloud Function:", error);
        throw error;
    }
};