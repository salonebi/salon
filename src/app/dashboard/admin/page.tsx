// src/app/dashboard/admin/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getAllUserProfiles } from '../../../lib/authService'; // This function is now updated internally
import { UserProfile } from '../../../types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const AdminDashboardPage: React.FC = () => {
    const { userRole, loading: authLoading } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

    useEffect(() => {
        if (!authLoading && userRole !== 'admin') {
            toast.error("Access Denied: You do not have permission to view this page.");
            router.push('/dashboard');
            return;
        }

        if (userRole === 'admin') {
            const fetchUsers = async () => {
                setLoadingUsers(true);
                try {
                    const userProfiles = await getAllUserProfiles(); // This now calls the Cloud Function
                    setUsers(userProfiles);
                } catch (error) {
                    console.error("Failed to fetch users:", error);
                    toast.error("Could not load user data. Please try again later.");
                } finally {
                    setLoadingUsers(false);
                }
            };

            fetchUsers();
        }
    }, [userRole, authLoading, router]);

    if (authLoading || loadingUsers) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-xl font-semibold text-gray-700">Loading Admin Dashboard...</div>
            </div>
        );
    }

    if (userRole !== 'admin') {
        return (
             <div className="flex items-center justify-center p-8">
                <div className="text-xl font-semibold text-red-600">Access Denied. Redirecting...</div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard: All Users</h1>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length > 0 ? (
                                users.map((profile) => (
                                    <tr key={profile.uid}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full object-cover" src={profile.photoURL ?? `https://i.pravatar.cc/150?u=${profile.uid}`} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{profile.displayName}</div>
                                                    <div className="text-sm text-gray-500">{profile.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${profile.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {profile.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(profile.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button variant="link" className="text-indigo-600 hover:text-indigo-900">Edit</Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
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