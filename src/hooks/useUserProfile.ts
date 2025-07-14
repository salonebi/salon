// src/hooks/useUserProfile.ts

import { useState, useEffect } from 'react';
import { ensureUserProfile } from '../lib/authService';
import { UserProfile } from '../types';
import { toast } from 'sonner';

export const useUserProfile = (userId: string | null) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState<boolean>(true); // Initial state is true
    const [profileError, setProfileError] = useState<string | null>(null);

    useEffect(() => {
        console.log("useUserProfile useEffect triggered. userId:", userId);
        const fetchProfile = async () => {
            if (!userId) {
                // If no userId is provided (e.g., user is not logged in yet or logged out)
                console.log("useUserProfile: No userId, setting profileLoading to false.");
                setProfileLoading(false);
                setUserProfile(null);
                setProfileError(null);
                return;
            }

            setProfileLoading(true); // Set to true at the start of fetching
            setProfileError(null); // Clear previous errors
            console.log("useUserProfile: Fetching profile for userId:", userId);

            try {
                // Call the Cloud Function to get/ensure the profile for the given userId
                // Assuming ensureUserProfile fetches the profile for the currently authenticated user.
                const profile = await ensureUserProfile();

                if (!profile) {
                    const errorMessage = "Your user profile could not be found.";
                    console.error("useUserProfile: " + errorMessage);
                    toast.error(errorMessage);
                    setProfileError(errorMessage);
                    setUserProfile(null);
                    return;
                }
                console.log("useUserProfile: Profile fetched successfully:", profile);
                setUserProfile(profile);

            } catch (error) {
                const errorMessage = `Failed to fetch user profile: ${(error as Error).message}`;
                console.error("useUserProfile Hook Error:", error);
                toast.error(errorMessage);
                setProfileError(errorMessage);
                setUserProfile(null);
            } finally {
                console.log("useUserProfile: Setting profileLoading to false (finally block).");
                setProfileLoading(false);
            }
        };

        fetchProfile();
    }, [userId]); // Dependency array now only includes userId

    return { userProfile, profileLoading, profileError };
};
