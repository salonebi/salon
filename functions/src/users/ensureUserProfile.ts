// functions/src/users/ensureUserProfile.ts

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { db, FieldValueAdmin, getUserProfilePath } from '../utils/firebaseAdmin';
import { UserProfile, UserRole } from '../types'; // Import UserProfile and UserRole

/**
 * Callable Cloud Function to ensure a user profile exists and retrieve it.
 * If the profile does not exist, it creates a new one with a 'customer' role
 * and initializes all required fields. If it exists, it updates `lastLoginAt`.
 *
 * This function should be called by the client after a successful authentication.
 *
 * @param {CallableRequest<void>} request - The request object.
 * @returns {Promise<UserProfile>} - The full user profile data (with Timestamps).
 */
export const ensureUserProfile = onCall(async (request: CallableRequest<void>) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = request.auth.uid;
  const userEmail = request.auth.token.email;
  const displayName = request.auth.token.name || 'New User';
  const photoURL = request.auth.token.picture || null;

  // IMPORTANT: Ensure `process.env.FIREBASE_APP_ID` is correctly configured in your Cloud Functions environment variables.
  // For local development, you might set it in a `.env` file or directly in your `firebase.json` for functions config.
  // Example: "FIREBASE_APP_ID": "your-firebase-app-id-here"
  const appId = "1:514813479729:web:4a0ec92280f130e8b63e10"; 
  if (!appId) {
      throw new HttpsError('internal', 'FIREBASE_APP_ID environment variable is not set.');
  }

  const userProfileRef = db.doc(getUserProfilePath(appId, userId));

  try {
    const docSnap = await userProfileRef.get();

    if (docSnap.exists) {
      // Profile exists, update lastLoginAt
      await userProfileRef.update({
        lastLoginAt: FieldValueAdmin.serverTimestamp(),
      });
      console.log(`Updated lastLoginAt for user: ${userId}`);

      const updatedProfileData = (await userProfileRef.get()).data() as UserProfile;
      // Return the updated profile with Timestamps (client side will handle conversion if needed)
      return updatedProfileData;

    } else {
      // Profile does not exist, create a new one
      const newUserProfile: UserProfile = {
        uid: userId,
        displayName: displayName,
        email: userEmail || null,
        photoURL: photoURL,
        phoneNumber: null, // Initialize as null or undefined
        createdAt: FieldValueAdmin.serverTimestamp() as any, // Will be Firestore Timestamp
        lastLoginAt: FieldValueAdmin.serverTimestamp() as any, // Will be Firestore Timestamp
        role: 'customer', // Default role for new users as per our plan
        ownedSalons: [], // Initialize as empty array
        associatedSalons: [], // Initialize as empty array
        favoriteSalons: [], // Initialize as empty array
        address: null, // Initialize as null or undefined
      };

      await userProfileRef.set(newUserProfile);
      console.log(`Created new profile for user: ${userId}`);

      // Return the newly created profile.
      // Note: serverTimestamp() will resolve on the server, so for immediate client use
      // the timestamp might be slightly delayed. For new creations, you could return
      // a temporary Date.now() for createdAt/lastLoginAt, but passing the raw
      // serverTimestamp and letting the client handle it is safer for consistency.
      // For simplicity here, we'll return the object with the pending timestamp.
      return newUserProfile;
    }
  } catch (error: any) {
    console.error("Error in ensureUserProfile Cloud Function:", error);
    throw new HttpsError('internal', 'Failed to set up user profile.', error.message);
  }
});

// You'll also need to ensure `getUserProfilePath` is correct in `utils/firebaseAdmin.ts`
// Example for `utils/firebaseAdmin.ts`:
/*
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const FieldValueAdmin = admin.firestore.FieldValue;

export const getUserProfilePath = (appId: string, userId: string) => `users/${userId}`; // The appId parameter is not used in the path itself for users, but if you used a subcollection per app, it would be. For now, it's just `users/{userId}`.
*/