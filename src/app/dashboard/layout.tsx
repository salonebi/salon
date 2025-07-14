// src/app/dashboard/layout.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'; // [cite: uploaded:salonebi/salon/salon-c2190c09c847a9b8c13089e779500534accd173b/src/context/AuthContext.tsx]
import { useAuthOperations } from '../../hooks/useAuthOperations'; // [cite: uploaded:salonebi/salon/salon-c2190c09c847a9b8c13089e779500534accd173b/src/hooks/useAuthOperations.ts]
import { toast } from 'sonner';
import { Button } from '@/components/ui/button'; // [cite: uploaded:salonebi/salon/salon-c2190c09c847a9b8c13089e779500534accd173b/src/components/ui/button.tsx]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Destructure user, userId, userProfile, and loading from useAuth
  const { user, userId, userProfile, loading: authLoading } = useAuth();
  const { signOutUser } = useAuthOperations();
  const router = useRouter();

  useEffect(() => {
    // This effect handles redirection based on the final authentication state.
    // If auth is not loading and there's no user (unauthenticated), redirect to login.
    if (!authLoading && !user) {
      toast.error("You must be logged in to access the dashboard.");
      router.push('/login');
    }
    // If user is authenticated but userProfile failed to load, show an error message and sign out.
    // This scenario is handled by the `if (user && !userProfile)` block below,
    // but a redirect might be desired here too if the error is severe.
    // For now, the error state is rendered directly.
  }, [authLoading, user, router]);

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/'); // Redirect to home page after sign-out
  };

  // 1. Show a full-page loading indicator ONLY while the initial auth check is running
  // or while the user profile is being fetched.
  if (authLoading || (user && !userProfile)) { // If user exists but profile isn't loaded yet
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-xl font-semibold text-gray-700">Verifying authentication and loading profile...</div>
      </div>
    );
  }

  // 2. If the user is not authenticated (and not loading), the useEffect has already
  // started a redirect, so we render null to avoid a flash of content.
  if (!user) {
    return null;
  }

  // 3. If everything is loaded correctly (user and userProfile are present), render the full dashboard layout.
  // The `userProfile` is guaranteed to be non-null here due to the `if` conditions above.
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-white shadow-md p-6 hidden md:flex flex-col">
        <div className="text-2xl font-bold text-indigo-700 mb-10">SalonApp</div>
        <nav className="space-y-3">
          {/* Add navigation links here later based on userProfile.role, ownedSalons, associatedSalons */}
          <a href="#" className="block py-2 px-4 rounded-lg bg-indigo-100 text-indigo-700 font-semibold">Dashboard</a>
          <a href="#" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Appointments</a>
          <a href="#" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Settings</a>
          {userProfile?.role === 'admin' && (
            <>
              <a href="/dashboard/admin" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Admin Panel</a>
              <a href="/dashboard/admin/users" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Manage Users</a>
              <a href="/dashboard/admin/salons" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Manage Salons</a>
            </>
          )}
          {userProfile?.role === 'customer' && userProfile?.ownedSalons && userProfile.ownedSalons.length > 0 && (
            <>
              <a href="/dashboard/salon" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Salon Dashboard</a>
              <a href="/dashboard/salon/staff" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Manage Staff</a>
              <a href="/dashboard/salon/services" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Manage Services</a>
              <a href="/dashboard/salon/bookings" className="block py-2 px-4 rounded-lg hover:bg-gray-100">Salon Bookings</a>
            </>
          )}
          {/* Add more specific navigation for stylists/managers based on associatedSalons if needed */}
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