// src/types/index.ts

import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

/**
 * Defines the possible roles a user can have in the application.
 * 'null' is included to represent a state where the role is not yet determined or applicable.
 */
export type UserRole = 'admin' | 'user' | 'salon' | 'customer' | null; // Merged roles

/**
 * Defines the structure for a staff association within `associatedSalons`.
 * Stored in: artifacts/{appId}/public/data/salons/{salonId}/staff/{staffUserId}
 */
export interface AssociatedSalon {
  salonId: string;
  role: 'manager' | 'stylist' | 'receptionist' | 'other'; // Specific role within THAT salon
  startDate: Timestamp; // Use Timestamp for consistency with Firestore
  endDate?: Timestamp; // Optional end date
}

/**
 * Define the Address map structure
 */
export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * Describes the structure of a user's profile data as stored in your database (e.g., Firestore).
 * This is separate from the Firebase Auth User object and contains application-specific data.
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null; // Optional, as it might not always be present
  phoneNumber?: string | null; // Optional
  role: UserRole;
  createdAt: Timestamp; // Now using Timestamp
  updatedAt?: Timestamp; // Now using Timestamp
  lastLoginAt?: Timestamp; // Added from new types, optional
  ownedSalons?: string[]; // Array of salon IDs
  associatedSalons?: AssociatedSalon[]; // Array of staff associations
  favoriteSalons?: string[]; // Array of salon IDs
  address?: UserAddress | null; // Optional address map
}

/**
 * Defines the shape of the object provided by the AuthContext.
 * This is what components will consume when they use the `useAuth()` hook.
 */
export interface AuthContextType {
  user: User | null;         // The raw Firebase Auth user object (contains uid, email, etc.)
  userId: string | null;     // The user's unique ID (UID) for quick access
  userRole: UserRole;        // The user's application-specific role
  loading: boolean;          // A flag to indicate if the authentication state is still loading
  setUserRole: (role: UserRole) => void; // A function to allow updating the role in the context state if needed
}

/**
 * Defines the shape of the object returned by the `useAuthOperations` hook.
 * This provides a clear contract for the authentication functions and their state.
 */
export interface AuthOperations {
  googleSignIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  loadingAuth: boolean;
  authError: string | null;
}

/**
 * Defines the shape of the object returned by the `useProfileOperations` hook.
 */
export interface ProfileOperations {
  updateProfile: (updates: Partial<UserProfile> & { targetUid?: string }, newPhoto?: File | null) => Promise<void>;
  loadingProfile: boolean;
  profileError: string | null;
}

export interface Salon {
  id: string; // Document ID from Firestore
  name: string;
  address: string;
  description: string;
  ownerId: string; // The userId of the user who is the primary owner/manager of this salon
  // Add other salon-specific fields as needed (e.g., phone, email, services, images, operatingHours)
}

/**
 * Defines the structure for a Staff member document within a Salon's sub-collection.
 * Stored in: artifacts/{appId}/public/data/salons/{salonId}/staff/{staffUserId}
 */
export interface SalonStaff {
  id: string; // The userId of the staff member (same as their global Firebase UID)
  name: string; // Staff member's display name
  email: string; // Staff member's email
  roleInSalon: 'manager' | 'stylist' | 'receptionist' | 'other'; // Role specific to this salon
  // Add other staff-specific fields as needed (e.g., specialties, availability, linkedGoogleCalendarId)
}

/**
 * Defines the expected shape of data returned by callable Cloud Functions.
 */
export interface CallableResult {
  message: string;
  id?: string; // Optional, as addSalon returns an ID, but update/delete might not
}

// --- New interfaces for Callable Function input data (client-side view) ---

/**
 * Defines the input data for the 'addSalon' callable function.
 * This is what the client sends to the Cloud Function.
 */
export interface AddSalonData {
  name: string;
  address: string;
  description: string;
  ownerEmail: string;
}

/**
 * Defines the input data for the 'updateSalon' callable function.
 * This is what the client sends to the Cloud Function.
 */
export interface UpdateSalonData {
  id: string;
  name?: string;
  address?: string;
  description?: string;
  ownerEmail?: string;
}

/**
 * Defines the input data for the 'deleteSalon' callable function.
 * This is what the client sends to the Cloud Function.
 */
export interface DeleteSalonData {
  id: string;
}

// --- NEW TYPES FOR CALLABLE FUNCTIONS (continued) ---

/**
 * Input for the getAuthUserProfile callable function.
 */
export interface GetUserProfileCallableData {
  uid?: string;
}

/**
 * Base return type for user profile callable functions where dates are ISO strings.
 */
export type UserProfileCallableResult = Omit<UserProfile, 'createdAt' | 'updatedAt' | 'lastLoginAt'> & {
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

/**
 * Return type for getAuthUserProfile callable function.
 */
export type GetUserProfileCallableResult = UserProfileCallableResult | null;

/**
 * Input for the updateAuthUserProfile callable function.
 */
export interface UpdateUserProfileCallableData extends Partial<Omit<UserProfile, 'createdAt' | 'updatedAt' | 'lastLoginAt'>> {
  targetUid?: string;
  role?: UserRole;
}

/**
 * Return type for updateAuthUserProfile callable function.
 */
export interface UpdateUserProfileCallableResult {
  message: string;
}

/**
 * Return type for getAllUserProfiles callable function.
 */
export type GetAllUserProfilesCallableResult = UserProfileCallableResult[];

/**
 * Return type for ensureUserProfile callable function.
 * It always returns a UserProfile (or throws an error).
 */
export type EnsureUserProfileCallableResult = UserProfileCallableResult;