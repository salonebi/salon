// src/app/dashboard/user/page.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile'; // Corrected hook import
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const UserDashboardPage: React.FC = () => {
    const { user, userId, userRole, loading: authLoading } = useAuth();
    const router = useRouter();

    // The useUserProfile hook now fetches and validates the profile for the 'user' role.
    const { userProfile, profileLoading, profileError } = useUserProfile(userId, 'user');

    useEffect(() => {
        // This effect primarily handles redirection if auth state is resolved but invalid.
        // The DashboardLayout handles the initial redirection, this is a safeguard.
        if (!authLoading && !user) {
            toast.error("Authentication required. Redirecting to login.");
            router.push('/login');
        }
        // If there's a profile error (e.g., wrong role, not found), redirect.
        if (profileError) {
             // The hook already shows a toast message.
             router.push('/');
        }
    }, [authLoading, user, profileError, router]);

    // Combined loading state for a smoother experience.
    if (authLoading || profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="text-xl font-semibold text-gray-700">Loading User Dashboard...</div>
            </div>
        );
    }

    // If the profile data isn't available after loading, it means there was an error
    // and a redirect is in progress. Returning null prevents rendering broken UI.
    if (!userProfile) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-4 sm:p-8 flex flex-col items-center font-sans">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 sm:p-10 space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-green-800">
                        User Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">Welcome back, {userProfile.displayName || 'User'}!</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200 flex flex-col sm:flex-row items-center gap-6">
                    {userProfile.photoURL && (
                        <img
                            src={userProfile.photoURL}
                            alt="Profile Picture"
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-green-200 shadow-lg"
                        />
                    )}
                    <div className="text-center sm:text-left space-y-3 flex-grow">
                        <h3 className="text-2xl font-semibold text-gray-800">{userProfile.displayName}</h3>
                        <p className="text-gray-700 text-lg"><strong>Email:</strong> {userProfile.email}</p>
                        <p className="text-gray-700 text-lg">
                            <strong>Role:</strong>
                            <span className="ml-2 capitalize bg-green-200 text-green-800 font-medium py-1 px-3 rounded-full text-sm">
                                {userProfile.role}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200 space-y-3">
                     <h3 className="text-xl font-semibold text-gray-800 mb-2">Account Details</h3>
                     <p className="text-gray-600 text-sm">
                        <strong>User ID:</strong>
                        <span className="font-mono break-all ml-2">{userProfile.uid}</span>
                    </p>
                    <p className="text-gray-600 text-sm">
                        <strong>Member Since:</strong>
                        <span className="ml-2">{new Date(userProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </p>
                </div>

                <div className="text-center mt-6">
                    <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        className="border-gray-400 text-gray-800 hover:bg-gray-100"
                    >
                        Back to Home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UserDashboardPage;
