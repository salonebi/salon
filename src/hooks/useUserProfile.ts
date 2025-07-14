// src/hooks/useUserProfile.ts

import { useState, useEffect } from 'react';
import { ensureUserProfile } from '../lib/authService'; // Use the callable function wrapper
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
                // Call the Cloud Function to get/ensure the profile
                const profile = await ensureUserProfile(); // This now calls the Cloud Function

                if (!profile) {
                    const errorMessage = "Your user profile could not be found.";
                    toast.error(errorMessage);
                    setProfileError(errorMessage);
                    setUserProfile(null);
                    return;
                }

                // IMPORTANT: The `profile.role` from the Cloud Function will be 'admin' or 'customer'.
                // If `expectedRole` is 'salon' or 'stylist', you'll need to check `ownedSalons` or `associatedSalons`.
                // For now, this checks against the top-level 'role'.
                // A more robust check might be:
                // if (expectedRole === 'customer' && profile.role !== 'customer' && profile.role !== 'admin') { /* Error */ }
                // or specific checks for salon owner/staff based on `profile.ownedSalons` or `profile.associatedSalons`.
                // For now, we'll keep it simple based on the `role` field.
                if (profile.role !== expectedRole) {
                    const errorMessage = `Access Denied: This page is for '${expectedRole}' users only. Your role is '${profile.role}'.`;
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