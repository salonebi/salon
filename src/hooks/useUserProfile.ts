// src/hooks/useUserProfile.ts

'use client';

import { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types'; // Import UserProfile and UserRole types
import { getUserProfile } from '../lib/authService'; // Import the service to fetch profile
import { toast } from 'sonner'; // For toast notifications

interface UseUserProfileResult {
    userProfile: UserProfile | null;
    profileLoading: boolean;
    profileError: string | null;
}

/**
 * Custom hook to fetch and manage a user's profile data.
 * @param userId The UID of the user whose profile is to be fetched.
 * @param requiredRole (Optional) If provided, the hook will check if the fetched profile matches this role.
 * @returns An object containing userProfile, profileLoading, and profileError.
 */
export const useUserProfile = (userId: string | null, requiredRole?: UserRole): UseUserProfileResult => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState<boolean>(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) {
                setProfileLoading(false);
                setProfileError("User ID not available.");
                return;
            }

            setProfileLoading(true);
            setProfileError(null);
            try {
                const profile = await getUserProfile(userId);
                if (profile) {
                    if (requiredRole && profile.role !== requiredRole) {
                        setProfileError(`Access Denied: Role mismatch. Expected ${requiredRole}, got ${profile.role}.`);
                        setUserProfile(null);
                        toast.error(`Access Denied: Invalid role for this page.`);
                    } else {
                        setUserProfile(profile);
                    }
                } else {
                    setProfileError("User profile not found in database.");
                    setUserProfile(null);
                    toast.error("User profile not found.");
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setProfileError(`Failed to load profile: ${(error as Error).message}`);
                toast.error(`Failed to load profile: ${(error as Error).message}`);
            } finally {
                setProfileLoading(false);
            }
        };

        fetchProfile();
    }, [userId, requiredRole]); // Re-run when userId or requiredRole changes

    return { userProfile, profileLoading, profileError };
};
