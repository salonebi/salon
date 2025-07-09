// src/app/(auth)/login/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthOperations } from '../../../hooks/useAuthOperations';
import { Button } from '@/components/ui/button';

const LoginPage: React.FC = () => {
    const [message, setMessage] = useState<string>('');
    const router = useRouter();
    const { googleSignIn, loadingAuth, authError } = useAuthOperations();

    useEffect(() => {
        if (authError) {
            setMessage(authError);
        }
    }, [authError]);

    const handleGoogleLogin = async () => {
        setMessage('');
        try {
            await googleSignIn();
            // AuthContext now handles profile creation, so we just need to redirect.
            setMessage('Authentication successful! Redirecting to your dashboard...');
            // The DashboardLayout will handle role-based redirection.
            router.push('/dashboard/user'); 
        } catch (error) {
            // Error is already handled by the useAuthOperations hook.
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-4 flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
                <h2 className="text-4xl font-bold text-center text-indigo-800">Sign In</h2>

                {message && (
                    <div className={`px-4 py-3 rounded-md relative text-center ${message.includes('successful') ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-4">
                    <p className="text-center text-gray-700 text-lg">
                        Sign in or create an account with your Google account.
                    </p>
                    <Button
                        onClick={handleGoogleLogin}
                        disabled={loadingAuth}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {/* SVG Icon */}
                        {loadingAuth ? 'Signing In...' : 'Continue with Google'}
                    </Button>
                </div>

                <p className="text-center text-gray-600 text-sm">
                    <Button
                        variant="link"
                        onClick={() => router.push('/')}
                        className="text-gray-500 hover:text-gray-700 font-semibold focus:outline-none p-0 h-auto"
                    >
                        Back to Home
                    </Button>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;