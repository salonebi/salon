'use client';

import { useState } from 'react';
import { updateUserProfile } from '../lib/authService';
import { ProfileOperations, UserProfile } from '../types';
import { toast } from 'sonner';

export const useProfileOperations = (): ProfileOperations => {
    const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const updateProfile = async (
        userId: string,
        updates: Partial<UserProfile>,
        newPhoto?: File | null
    ) => {
        setLoadingProfile(true);
        setProfileError(null);
        try {
            await updateUserProfile(userId, updates, newPhoto);
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