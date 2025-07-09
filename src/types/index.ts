// src/types/index.ts

import { User } from 'firebase/auth'; // Import Firebase User type

// Define the possible user roles
export type UserRole = 'user' | 'salon' | 'admin';

// Define the structure for a user's profile stored in Firestore
export interface UserProfile {
    userId: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string; // ISO string format
    // Add any other user-specific fields here
}

// Define the shape of the AuthContext value
export interface AuthContextType {
    user: User | null; // Firebase User object
    userId: string | null; // Firebase User UID
    userRole: UserRole | null; // 'user', 'salon', 'admin'
    loading: boolean; // To indicate initial auth state loading
    setUserRole: (role: UserRole | null) => void; // Function to update role in context
}

// Define the shape of the Auth Operations Hook
export interface AuthOperations {
    googleSignIn: () => Promise<void>;
    signOutUser: () => Promise<void>;
    loadingAuth: boolean; // Loading state for auth operations (sign-in/out)
    authError: string | null; // Error message for auth operations
}

// Define Salon and Staff types (for future use)
export interface Salon {
    id: string;
    name: string;
    address: string;
    phone: string;
    description: string;
    ownerId: string;
    googleCalendarId?: string; // Optional: main calendar for the salon
}

export interface Staff {
    id: string;
    name: string;
    role: string; // e.g., 'Stylist', 'Manager', 'Receptionist'
    googleCalendarId?: string; // Optional: personal calendar for the staff
}

// Add other types as your application grows (e.g., Booking, Service)
