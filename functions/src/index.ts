// functions/index.ts

import * as admin from 'firebase-admin';
// Import specific modules from firebase-functions/v2
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore'; // Explicitly import FieldValue

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const authAdmin = admin.auth(); // Initialize Firebase Auth Admin SDK

// Define the base path for user profiles to check roles
const getUserProfilePath = (appId: string, userId: string) => `artifacts/${appId}/users/${userId}/profile/data`;
// Define the base path for public salon data
const getSalonsCollectionPath = (appId: string) => `artifacts/${appId}/public/data/salons`;

/**
 * Helper function to verify if the caller is an authenticated administrator.
 * Throws an HttpsError if not authorized.
 */
async function assertAdmin(request: CallableRequest<any>, appId: string) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = request.auth.uid;
  const userProfileRef = db.doc(getUserProfilePath(appId, userId));
  const userProfileSnap = await userProfileRef.get();

  if (!userProfileSnap.exists) {
    throw new HttpsError('permission-denied', 'User profile not found.');
  }

  const userRole = userProfileSnap.data()?.role;
  if (userRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Only administrators can perform this action.');
  }
}

/**
 * Interface for the data payload of the addSalon callable function.
 */
interface AddSalonData {
  name: string;
  address: string;
  description: string;
  ownerEmail: string;
  appId: string;
}

/**
 * Callable Cloud Function to add a new salon.
 * Requires admin privileges.
 * Assigns ownership via owner's email.
 *
 * @param {CallableRequest<AddSalonData>} request - The request object containing data and context.
 */
export const addSalon = onCall(async (request: CallableRequest<AddSalonData>) => {
  const { name, address, description, ownerEmail, appId } = request.data;

  // 1. Authenticate and authorize the caller as an admin
  await assertAdmin(request, appId);

  // 2. Validate input data
  if (!name || !address || !description || !ownerEmail || !appId) {
    throw new HttpsError('invalid-argument', 'Missing required salon fields or owner email.');
  }

  let ownerId: string;
  try {
    // 3. Look up owner's UID by email
    const userRecord = await authAdmin.getUserByEmail(ownerEmail);
    ownerId = userRecord.uid;
  } catch (error: any) {
    console.error("Error looking up owner by email:", ownerEmail, error);
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', `User with email ${ownerEmail} not found. Please ensure the user exists.`);
    }
    throw new HttpsError('internal', 'Failed to verify owner email.', error.message);
  }

  try {
    // 4. Add the salon document to Firestore
    const newSalonRef = await db.collection(getSalonsCollectionPath(appId)).add({
      name,
      address,
      description,
      ownerId, // Store the UID
      createdAt: FieldValue.serverTimestamp(), // Use FieldValue from admin.firestore
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 5. Optional: Update the owner's global role to 'salon' if they are currently 'user'
    const ownerProfileRef = db.doc(getUserProfilePath(appId, ownerId));
    const ownerProfileSnap = await ownerProfileRef.get();

    if (ownerProfileSnap.exists && ownerProfileSnap.data()?.role === 'user') {
      await ownerProfileRef.update({ role: 'salon' });
      console.log(`Updated owner ${ownerId} role to 'salon' for new salon ${newSalonRef.id}`);
    } else if (!ownerProfileSnap.exists) {
      // If the owner profile doesn't exist, create a basic one with 'salon' role
      // This handles cases where an admin assigns a salon to a user who hasn't logged in yet
      await ownerProfileRef.set({
        email: ownerEmail, // Store email for reference
        role: 'salon',
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true }); // Use merge to avoid overwriting if partial profile exists
      console.log(`Created default 'salon' profile for new owner ${ownerId}.`);
    }

    // 6. Optional: Send an invitation email to the ownerEmail
    // This would involve integrating with an email service (e.g., SendGrid, Nodemailer)
    // For example: await sendInvitationEmail(ownerEmail, name);
    console.log(`Invitation to manage salon ${name} could be sent to ${ownerEmail}.`);


    return { id: newSalonRef.id, message: 'Salon added successfully!' };
  } catch (error: any) {
    console.error("Error adding salon in Cloud Function:", error);
    throw new HttpsError('internal', 'Failed to add salon.', error.message);
  }
});

/**
 * Interface for the data payload of the updateSalon callable function.
 */
interface UpdateSalonData {
  id: string;
  name?: string;
  address?: string;
  description?: string;
  ownerEmail?: string;
  appId: string;
}

/**
 * Callable Cloud Function to update an existing salon.
 * Requires admin privileges.
 * Can update owner via owner's email.
 *
 * @param {CallableRequest<UpdateSalonData>} request - The request object containing data and context.
 */
export const updateSalon = onCall(async (request: CallableRequest<UpdateSalonData>) => {
  const { id, name, address, description, ownerEmail, appId } = request.data;

  // 1. Authenticate and authorize the caller as an admin
  await assertAdmin(request, appId);

  // 2. Validate input data
  if (!id || !appId || (!name && !address && !description && !ownerEmail)) {
    throw new HttpsError('invalid-argument', 'Missing salon ID or update fields.');
  }

  let ownerId: string | undefined;
  if (ownerEmail) {
    try {
      // 3. Look up new owner's UID by email if email is provided for update
      const userRecord = await authAdmin.getUserByEmail(ownerEmail);
      ownerId = userRecord.uid;
    } catch (error: any) {
      console.error("Error looking up new owner by email:", ownerEmail, error);
      if (error.code === 'auth/user-not-found') {
        throw new HttpsError('not-found', `User with email ${ownerEmail} not found. Please ensure the user exists.`);
      }
      throw new HttpsError('internal', 'Failed to verify new owner email.', error.message);
    }
  }

  try {
    // 4. Update the salon document in Firestore
    const salonDocRef = db.doc(`${getSalonsCollectionPath(appId)}/${id}`);
    const updateData: { [key: string]: any } = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (description) updateData.description = description;
    if (ownerId) { // Use the resolved ownerId if it was provided
      updateData.ownerId = ownerId;

      // Optional: Update the new owner's global role to 'salon'
      const newOwnerProfileRef = db.doc(getUserProfilePath(appId, ownerId));
      const newOwnerProfileSnap = await newOwnerProfileRef.get();
      if (newOwnerProfileSnap.exists && newOwnerProfileSnap.data()?.role === 'user') {
        await newOwnerProfileRef.update({ role: 'salon' });
        console.log(`Updated new owner ${ownerId} role to 'salon' for salon ${id}`);
      } else if (!newOwnerProfileSnap.exists) {
         await newOwnerProfileRef.set({
            email: ownerEmail,
            role: 'salon',
            createdAt: FieldValue.serverTimestamp(),
         }, { merge: true });
         console.log(`Created default 'salon' profile for new owner ${ownerId}.`);
      }
    }

    await salonDocRef.update(updateData);

    return { message: 'Salon updated successfully!' };
  } catch (error: any) {
    console.error("Error updating salon in Cloud Function:", error);
    throw new HttpsError('internal', 'Failed to update salon.', error.message);
  }
});

/**
 * Interface for the data payload of the deleteSalon callable function.
 */
interface DeleteSalonData {
  id: string;
  appId: string;
}

/**
 * Callable Cloud Function to delete a salon.
 * Requires admin privileges.
 *
 * @param {CallableRequest<DeleteSalonData>} request - The request object containing data and context.
 */
export const deleteSalon = onCall(async (request: CallableRequest<DeleteSalonData>) => {
  const { id, appId } = request.data;

  // 1. Authenticate and authorize the caller as an admin
  await assertAdmin(request, appId);

  // 2. Validate input data
  if (!id || !appId) {
    throw new HttpsError('invalid-argument', 'Missing salon ID.');
  }

  try {
    // 3. Delete the salon document from Firestore
    const salonDocRef = db.doc(`${getSalonsCollectionPath(appId)}/${id}`);
    await salonDocRef.delete();

    // Optional: Clean up associated staff sub-collections, bookings, etc.
    // This can be done with a recursive delete function or by handling it on the client.
    // For simplicity, this function only deletes the main salon document.

    return { message: 'Salon deleted successfully!' };
  } catch (error: any) {
    console.error("Error deleting salon in Cloud Function:", error);
    throw new HttpsError('internal', 'Failed to delete salon.', error.message);
  }
});
