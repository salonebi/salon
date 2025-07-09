// src/app/dashboard/user/page.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useUserProfile } from '../../../hooks/useUserProfile'; // Import the new hook
import { toast } from 'sonner'; // For toast notifications

const UserDashboardPage: React.FC = () => {
    const { user, userId, userRole, loading: authLoading } = useAuth(); // Renamed loading to authLoading
    const router = useRouter();

    // Use the new useUserProfile hook to fetch the profile for the 'user' role
    const { userProfile, profileLoading, profileError } = useUserProfile(userId, 'user');

    useEffect(() => {
        // This useEffect handles redirection based on authentication and role
        if (!authLoading) { // Ensure AuthContext has finished loading
            if (!user) {
                toast.error("You must be logged in to view this page.");
                router.push('/');
            } else if (userRole !== 'user') {
                // This condition handles cases where a non-user role tries to access this page.
                // The useUserProfile hook also handles role mismatch and toasts an error.
                // This ensures a redirect if the user is authenticated but not a 'user'.
                toast.error("Access Denied: You must be a regular user to view this page.");
                router.push('/'); // Redirect to home or a more appropriate dashboard
            }
        }

        // The profileError is already handled by the useUserProfile hook via toasts.
        // You can add additional logging here if needed, but no direct UI message.
        if (profileError) {
            console.error("Dashboard Profile Error:", profileError);
        }
    }, [authLoading, user, userId, userRole, profileError, router]); // Dependencies for useEffect

    // Show loading state if authentication is still loading or profile is loading
    if (authLoading || profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="text-xl font-semibold text-gray-700">Loading user dashboard...</div>
            </div>
        );
    }

    // If, after all loading, the user is not authenticated or not a 'user' role,
    // this means the useEffect has already initiated a redirect.
    // We return null here to prevent rendering the dashboard content for unauthorized users.
    if (!user || userRole !== 'user' || !userProfile) { // Also check if userProfile is null
        return null; // Or a more explicit "Redirecting..." message
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-4 flex flex-col items-center font-sans">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl p-8 space-y-8">
                <h1 className="text-5xl font-extrabold text-center text-green-800 mb-8">
                    User Dashboard
                </h1>

                <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Your Profile</h3>
                    {/* userProfile is guaranteed to be not null here due to the check above */}
                    <div className="space-y-2">
                        <p className="text-gray-700 text-lg"><strong>Name:</strong> {userProfile.name}</p>
                        <p className="text-gray-700 text-lg"><strong>Email:</strong> {userProfile.email}</p>
                        <p className="text-gray-700 text-lg"><strong>Role:</strong> <span className="capitalize">{userProfile.role}</span></p>
                        <p className="text-gray-500 text-sm">User ID: <span className="font-mono break-all">{userProfile.userId}</span></p>
                        <p className="text-gray-500 text-sm">Member Since: {new Date(userProfile.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <button
                        onClick={() => router.push('/')}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDashboardPage;
