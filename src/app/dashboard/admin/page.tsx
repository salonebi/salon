// src/app/dashboard/admin/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getAllUserProfiles } from '../../../lib/authService'; // This function is now updated internally [cite: uploaded:salonebi/salon/salon-c2190c09c847a9b8c13089e779500534accd173b/src/lib/authService.ts]
import { UserProfile } from '../../../types'; // Import UserProfile from types [cite: uploaded:salonebi/salon/salon-c2190c09c847a9b8c13089e779500534accd173b/src/types/index.ts]
import { toast } from 'sonner';
import { Button } from '@/components/ui/button'; // [cite: uploaded:salonebi/salon/salon-c2190c09c847a9b8c13089e779500534accd173b/src/components/ui/button.tsx]
import { useUserProfile } from '@/hooks/useUserProfile';

const AdminDashboardPage: React.FC = () => {
    const { user, userId, loading: authLoading } = useAuth(); // Removed userRole from destructuring as useUserProfile handles it
    const router = useRouter();

    // The useUserProfile hook now fetches and validates the profile for the 'customer' role.
    // This is aligned with our updated UserRole type in src/types/index.ts.
    const { userProfile, profileLoading, profileError,  } = useUserProfile(userId, 'customer');

    const [users, setUsers] = useState<UserProfile[]>([]); // State now holds UserProfile objects (with Date objects)
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
    const [errorUsers, setErrorUsers] = useState<string | null>(null); // New state for specific user list errors

    useEffect(() => {
        // Redirect if not authenticated or not an admin
        if (!authLoading && user) {
            toast.error("Access Denied: You do not have permission to view this page.");
            router.push('/'); // Redirect to home or login page
            return;
        }

        // Fetch users only if authenticated and is an admin
        if (userProfile?.role === 'customer') {
            const fetchUsers = async () => {
                setLoadingUsers(true);
                setErrorUsers(null); // Clear previous errors
                try {
                    const userProfiles = await getAllUserProfiles(); // This now calls the Cloud Function [cite: uploaded:salonebi/salon/salon-c2190c09c847a9b8c13089e779500534accd173b/functions/src/users/getAllUserProfiles.ts]
                    // The getAllUserProfiles function in authService.ts already converts ISO strings to Date objects.
                    setUsers(userProfiles);
                } catch (error) {
                    const errorMessage = `Failed to load user data: ${(error as Error).message}`;
                    console.error("Failed to fetch users:", error);
                    toast.error(errorMessage);
                    setErrorUsers(errorMessage); // Set specific error for user list
                } finally {
                    setLoadingUsers(false);
                }
            };

            fetchUsers();
        }
    }, [userProfile?.role, authLoading, router]);

    // Combined loading state for a smoother experience.
    if (authLoading || loadingUsers) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
                <div className="text-xl font-semibold text-gray-700">Loading Admin Dashboard...</div>
            </div>
        );
    }

    // If access is denied (after loading), show a message and prevent rendering the content
    if (userProfile?.role !== 'customer') {
        return (
             <div className="flex items-center justify-center min-h-screen bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 p-8 rounded-lg shadow-md">
                <div className="text-xl font-semibold text-red-600">Access Denied. Redirecting...</div>
            </div>
        );
    }

    // If there was an error fetching users but the user is an admin
    if (errorUsers) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 p-4 rounded-lg shadow-md">
                <p className="text-lg font-semibold">Error: {errorUsers}</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
            <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard: All Users</h1>

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
                                            {/* createdAt is a Date object from authService now */}
                                            {profile.createdAt instanceof Date ? profile.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button variant="link" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">Edit</Button>
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