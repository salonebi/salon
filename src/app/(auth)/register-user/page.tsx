// src/app/(auth)/register-user/page.tsx

'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect for message handling
import { useRouter } from 'next/navigation';
import { useAuthOperations } from '../../../hooks/useAuthOperations'; // Import the new hook

// NOTE: To use shadcn/ui components, you must first install and configure shadcn/ui in your Next.js project.
// Then, add the specific components you need:
// npx shadcn-ui@latest add button
import { Button } from '@/components/ui/button'; // Assuming this path based on shadcn/ui setup

const RegisterUserPage: React.FC = () => {
    const [message, setMessage] = useState<string>('');
    const router = useRouter();
    const { googleSignIn, loadingAuth, authError } = useAuthOperations(); // Use the new hook

    useEffect(() => {
        if (authError) {
            setMessage(authError);
        }
    }, [authError]);

    const handleGoogleRegister = async () => {
        setMessage(''); // Clear previous messages
        try {
            await googleSignIn(); // This handles the Google auth and profile creation in AuthContext
            setMessage('Registration successful via Google! Redirecting to dashboard...');
            router.push('/dashboard/user'); // Redirect to user dashboard
        } catch (error) {
            // Error handled by useAuthOperations, message set by useEffect
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-4 flex flex-col items-center justify-center font-sans">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
                <h2 className="text-4xl font-bold text-center text-indigo-800">Register Account</h2>

                {message && (
                    <div className={`px-4 py-3 rounded-md relative text-center ${message.includes('successful') ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-4">
                    <p className="text-center text-gray-700 text-lg">
                        Registering is quick and easy with your Google account.
                    </p>
                    <Button
                        onClick={handleGoogleRegister}
                        disabled={loadingAuth} // Disable button during auth operation
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M44.5 20H24V28.5H35.5C34.5 32.5 31.5 35.5 27 36.5V42H44.5C46.5 39.5 48 35.5 48 30.5C48 25.5 46.5 21 44.5 20Z" fill="#4285F4"/>
                            <path d="M24 48C30.5 48 36 46 40 42L32.5 36.5C29.5 38.5 26 39.5 24 39.5C18 39.5 13 35.5 11 29.5H4.5V36C6.5 41 12 45 18 47L24 48Z" fill="#34A853"/>
                            <path d="M11 29.5C10.5 28 10.5 26.5 10.5 24.5C10.5 22.5 10.5 21 11 19.5V13.5H4.5C3 16.5 2 20.5 2 24.5C2 28.5 3 32.5 4.5 36L11 29.5Z" fill="#FBBC05"/>
                            <path d="M24 8.5C27 8.5 29.5 9.5 31.5 11.5L38 6C36 4 30.5 2 24 2C18 2 12.5 6 10.5 11.5L17 17C19 14 21.5 13 24 13C26.5 13 29 14 31.5 15.5L38 10C36 8 30.5 6 24 6Z" fill="#EA4335"/>
                        </svg>
                        {loadingAuth ? 'Registering...' : 'Sign Up with Google'}
                    </Button>
                </div>

                <p className="text-center text-gray-600 text-sm">
                    Already have an account?{' '}
                    <Button
                        variant="link"
                        onClick={() => router.push('/login')}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold focus:outline-none p-0 h-auto"
                    >
                        Login here
                    </Button>
                </p>
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

export default RegisterUserPage;