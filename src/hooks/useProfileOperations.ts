// src/hooks/useProfileOperations.ts

'use client';

import { useState } from 'react';
import { updateUserProfile } from '../lib/authService'; // This function is now updated internally
import { ProfileOperations, UserProfile } from '../types';
import { toast } from 'sonner';

export const useProfileOperations = (): ProfileOperations => {
    const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const updateProfile = async (
        updates: Partial<UserProfile> & { targetUid?: string }, // Matches the interface and new authService function
        newPhoto?: File | null
    ) => {
        setLoadingProfile(true);
        setProfileError(null);
        try {
            // Directly pass the 'updates' object and 'newPhoto' to updateUserProfile
            // The targetUid is now part of the 'updates' object as expected by authService.updateUserProfile
            await updateUserProfile(updates, newPhoto);
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            const errorMessage = `Profile update failed: ${error.message}`;
            toast.error(errorMessage);
            setProfileError(errorMessage);
        } finally {
            setLoadingProfile(false);
        }
    };

    return {
        updateProfile,
        loadingProfile,
        profileError,
    };
};