// src/hooks/useUserProfile.ts

import { useState, useEffect } from 'react';
import { getUserProfile } from '../lib/authService'; // This function is now updated internally
import { UserProfile, UserRole } from '../types';
import { toast } from 'sonner';

export const useUserProfile = (userId: string | null, expectedRole: UserRole) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState<boolean>(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) {
                setProfileLoading(false);
                return;
            }

            setProfileLoading(true);
            setProfileError(null);

            try {
                const profile = await getUserProfile(userId); // This now calls the Cloud Function

                if (!profile) {
                    const errorMessage = "Your user profile could not be found.";
                    toast.error(errorMessage);
                    setProfileError(errorMessage);
                    setUserProfile(null);
                    return;
                }

                if (profile.role !== expectedRole) {
                    const errorMessage = `Access Denied: This page is for '${expectedRole}' users only.`;
                    toast.error(errorMessage);
                    setProfileError(errorMessage);
                    setUserProfile(null);
                    return;
                }

                setUserProfile(profile);

            } catch (error) {
                const errorMessage = `Failed to fetch user profile: ${(error as Error).message}`;
                console.error("useUserProfile Hook Error:", error);
                toast.error(errorMessage);
                setProfileError(errorMessage);
                setUserProfile(null);
            } finally {
                setProfileLoading(false);
            }
        };

        fetchProfile();
    }, [userId, expectedRole]);

    return { userProfile, profileLoading, profileError };
};