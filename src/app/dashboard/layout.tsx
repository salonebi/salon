// src/app/dashboard/layout.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed
import { toast } from 'sonner'; // For toast notifications

// NOTE: To use shadcn/ui components, you must first install and configure shadcn/ui in your Next.js project.
// Then, add the specific components you need:
// npx shadcn-ui@latest add button
import { Button } from '@/components/ui/button'; // Assuming this path based on shadcn/ui setup

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get the current pathname using usePathname

  useEffect(() => {
    // This useEffect handles authentication and role-based redirection for all dashboard routes.
    if (!authLoading) { // Ensure AuthContext has finished loading
      if (!user) {
        // If no user is logged in, redirect to home/login
        toast.error("You must be logged in to access the dashboard.");
        router.push('/');
      } else if (!userRole) {
        // If user is logged in but role is not yet determined (should be rare after profile creation)
        // Or if profile fetching failed in AuthContext
        toast.error("Your user role could not be determined. Please try again.");
        router.push('/');
      } else {
        // If user is authenticated and role is determined, ensure they are on the correct dashboard route
        // This prevents a 'salon' user from seeing the 'user' dashboard if they manually type the URL
        const expectedPath = `/dashboard/${userRole}`;
        if (pathname !== expectedPath && !pathname.startsWith(expectedPath + '/')) { // Use pathname here
            // Only redirect if not already on the correct dashboard or a sub-path of it
            router.push(expectedPath);
        }
      }
    }
  }, [authLoading, user, userRole, pathname, router]); // Add pathname to dependencies

  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-xl font-semibold text-gray-700">Loading dashboard layout...</div>
      </div>
    );
  }

  // If user is not authenticated or role is not determined after loading,
  // the useEffect above will handle the redirection. Return null to prevent rendering content.
  if (!user || !userRole) {
    return null;
  }

  // Render the dashboard content for authenticated users with a determined role
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Placeholder (Future component) */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <div className="text-2xl font-bold text-indigo-700 mb-8">Dashboard Nav</div>
        <nav className="space-y-4">
          {userRole === 'user' && (
            <>
              <Button
                variant="ghost" // Use ghost variant for navigation links
                onClick={() => router.push('/dashboard/user')}
                className="block w-full text-left py-2 px-4 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
              >
                My Profile
              </Button>
              <Button
                variant="ghost" // Use ghost variant for navigation links
                onClick={() => router.push('/salons')} // Link to public salon listing
                className="block w-full text-left py-2 px-4 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
              >
                Browse Salons
              </Button>
              {/* Add more user-specific links */}
            </>
          )}
          {userRole === 'salon' && (
            <>
              <Button
                variant="ghost" // Use ghost variant for navigation links
                onClick={() => router.push('/dashboard/salon')}
                className="block w-full text-left py-2 px-4 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
              >
                Salon Overview
              </Button>
              <Button
                variant="ghost" // Use ghost variant for navigation links
                onClick={() => router.push('/dashboard/salon/staff')}
                className="block w-full text-left py-2 px-4 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
              >
                Manage Staff
              </Button>
              {/* Add more salon-specific links */}
            </>
          )}
          {userRole === 'admin' && (
            <>
              <Button
                variant="ghost" // Use ghost variant for navigation links
                onClick={() => router.push('/dashboard/admin')}
                className="block w-full text-left py-2 px-4 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
              >
                Admin Overview
              </Button>
              <Button
                variant="ghost" // Use ghost variant for navigation links
                onClick={() => router.push('/dashboard/admin/users')}
                className="block w-full text-left py-2 px-4 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
              >
                Manage Users
              </Button>
              <Button
                variant="ghost" // Use ghost variant for navigation links
                onClick={() => router.push('/dashboard/admin/salons')}
                className="block w-full text-left py-2 px-4 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
              >
                Manage Salons
              </Button>
              {/* Add more admin-specific links */}
            </>
          )}
          <Button
            variant="ghost" // Use ghost variant for navigation links
            onClick={() => router.push('/')}
            className="block w-full text-left py-2 px-4 rounded-lg text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors duration-200 mt-8"
          >
            Back to Home
          </Button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children} {/* This is where the specific dashboard page content will be rendered */}
      </main>
    </div>
  );
}
