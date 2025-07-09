// src/app/page.tsx

'use client';

import React,
{
    useState,
    useEffect
}
from 'react';
import {
    useRouter
} from 'next/navigation';

const HomePage = () => {
    const router = useRouter();
    // In a real app, you'd get the user from a context or a hook
    // For demonstration, we'll just simulate a user check.
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate checking for user authentication
        const checkAuth = () => {
            // Replace this with your actual authentication check
            const loggedInUser = null; // Or your function to get user

            if (!loggedInUser) {
                router.push('/login');
            } else {
                setUser(loggedInUser);
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <p className="text-xl text-purple-800">Loading...</p>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 flex flex-col items-center font-sans">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl p-8 space-y-8">
                <h1 className="text-5xl font-extrabold text-center text-purple-800 mb-8">
                    Salon Booking App
                </h1>
            </div>
        </div>
    );
};

export default HomePage;