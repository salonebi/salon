// src/app/dashboard/layout.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useAuthOperations } from '../../hooks/useAuthOperations';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading: authLoading } = useAuth();
  const { signOutUser } = useAuthOperations();
  const router = useRouter();

  useEffect(() => {
    // This effect handles redirection based on the final authentication state.
    if (!authLoading && !user) {
      toast.error("You must be logged in to access the dashboard.");
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/'); // Redirect to home page after sign-out
  };

  // 1. Show a full-page loading indicator ONLY while the initial auth check is running.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-xl font-semibold text-gray-700">Verifying authentication...</div>
      </div>
    );
  }

  // 2. After the initial load, if the user is authenticated but their profile/role
  // could not be loaded, show an error state instead of getting stuck.
  if (user && !userRole) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-center">
            <h2 className="text-2xl font-bold text-red-700 mb-4">Error Loading Profile</h2>
            <p className="text-red-600 mb-6">We couldn't load your user profile data. This might be a temporary issue.</p>
            <div className="flex gap-4">
                 <Button onClick={handleSignOut} variant="destructive">
                    Sign Out
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                </Button>
            </div>
        </div>
    );
  }

  // 3. If the user is not authenticated (and not loading), the useEffect has already
  // started a redirect, so we render nothing to avoid a flash of content.
  if (!user) {
    return null;
  }

  // 4. If everything is loaded correctly, render the full dashboard layout.
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-white shadow-md p-6 hidden md:flex flex-col">
        <div className="text-2xl font-bold text-indigo-700 mb-10">SalonApp</div>
        <nav className="space-y-3">
          {/* Add navigation links here later */}
          <a href="#" className="block py-2 px-4 rounded-lg bg-indigo-100 text-indigo-700 font-semibold">Dashboard</a>
          <a href="#" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Appointments</a>
          <a href="#" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Settings</a>
        </nav>
        <div className="mt-auto">
            <Button onClick={handleSignOut} variant="outline" className="w-full">
                Sign Out
            </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center md:hidden">
            <div className="text-xl font-bold text-indigo-700">SalonApp</div>
            <Button onClick={handleSignOut} size="sm" variant="outline">Sign Out</Button>
        </header>
        <div className="p-4 sm:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
