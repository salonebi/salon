import { useState, useEffect } from 'react';
import { getUserProfile } from '../lib/authService';
import { UserProfile, UserRole } from '../types';
import { toast } from 'sonner';

/**
 * Custom hook to fetch and validate a user's profile.
 * @param userId - The ID of the user whose profile to fetch.
 * @param expectedRole - The role the user is expected to have. Access is denied if roles mismatch.
 * @returns An object containing the user profile, loading state, and any errors.
 */
export const useUserProfile = (userId: string | null, expectedRole: UserRole) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState<boolean>(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            // If there's no userId, we can't fetch a profile.
            if (!userId) {
                setProfileLoading(false);
                return;
            }

            setProfileLoading(true);
            setProfileError(null);

            try {
                const profile = await getUserProfile(userId);

                if (!profile) {
                    const errorMessage = "Your user profile could not be found.";
                    toast.error(errorMessage);
                    setProfileError(errorMessage);
                    setUserProfile(null);
                    return;
                }

                // Security check: ensure the fetched profile has the expected role for this page.
                if (profile.role !== expectedRole) {
                    const errorMessage = `Access Denied: This page is for '${expectedRole}' users only.`;
                    toast.error(errorMessage);
                    setProfileError(errorMessage);
                    setUserProfile(null); // Do not set profile if role is incorrect
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
    }, [userId, expectedRole]); // Rerun effect if userId or expectedRole changes

    return { userProfile, profileLoading, profileError };
};
