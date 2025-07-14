// src/app/dashboard/admin/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getAllUserProfiles } from '../../../lib/authService';
import { UserProfile } from '../../../types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';

const AdminDashboardPage: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // The useUserProfile hook is now called without the 'expectedRole' argument.
    const { userProfile, profileLoading } = useUserProfile(user?.uid);

    // FIX: Corrected initial state from 'true' to '[]' for users array
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true); // Initial state is true
    const [errorUsers, setErrorUsers] = useState<string | null>(null);

    useEffect(() => {
        console.log("AdminDashboardPage useEffect triggered.");
        console.log("Current Auth State: authLoading =", authLoading, "user =", user);

        // Check if authentication is done and no user is logged in
        if (!authLoading && !user) {
            console.log("AdminDashboardPage: Not authenticated, redirecting to /login.");
            toast.info("Please log in to view the user list. (Optional: remove this check for full public access)");
            router.push('/login');
            return; // Stop execution of this useEffect
        }

        const fetchUsers = async () => {
            setLoadingUsers(true); // Indicate that user data is being loaded
            setErrorUsers(null); // Clear any previous errors
            console.log("AdminDashboardPage: Starting fetchUsers...");
            try {
                const userProfiles = await getAllUserProfiles();
                console.log("AdminDashboardPage: Users fetched successfully. Count:", userProfiles.length);
                setUsers(userProfiles);
            } catch (error) {
                const errorMessage = `Failed to load user data: ${(error as Error).message}`;
                console.error("AdminDashboardPage: Failed to fetch users:", error);
                toast.error(errorMessage);
                setErrorUsers(errorMessage);
            } finally {
                console.log("AdminDashboardPage: Setting loadingUsers to false (finally block).");
                setLoadingUsers(false); // Loading is complete (success or failure)
            }
        };

        // Only attempt to fetch users if authentication is complete AND a user is present.
        // This prevents fetching before auth state is known or for unauthenticated users (if the redirect above is active).
        if (!authLoading && user) {
            console.log("AdminDashboardPage: Auth ready and user present, initiating fetchUsers.");
            fetchUsers();
        } else if (authLoading) {
            console.log("AdminDashboardPage: Authentication still in progress...");
        }
        // If !user and !authLoading, the redirect above should have handled it.
    }, [authLoading, user, router]); // Dependencies: authLoading, user, and router for effect re-runs

    // Log all loading states before rendering the component
    console.log("AdminDashboardPage Render State: authLoading =", authLoading, "loadingUsers =", loadingUsers, "profileLoading =", profileLoading);

    // Display loading screen if any of the main loading states are true
    if (authLoading || loadingUsers || profileLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
                <div className="text-xl font-semibold text-gray-700">Loading User Dashboard...</div>
            </div>
        );
    }

    // Display error message if there was an error fetching users
    if (errorUsers) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 p-4 rounded-lg shadow-md">
                <p className="text-lg font-semibold">Error: {errorUsers}</p>
            </div>
        );
    }

    // Main content of the dashboard
    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
            <h1 className="text-3xl font-bold mb-6 text-center">All Registered Users</h1>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member Since</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.length > 0 ? (
                                users.map((profile) => (
                                    <tr key={profile.uid} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full object-cover" src={profile.photoURL ?? `https://i.pravatar.cc/150?u=${profile.uid}`} alt="Profile" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-50">{profile.displayName}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${profile.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'}`}>
                                                {profile.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {profile.createdAt instanceof Date ? profile.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button variant="link" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">View Details</Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
