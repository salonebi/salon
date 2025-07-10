// functions/index.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This is automatically done in Cloud Functions environment,
// but explicitly calling it ensures it's initialized for local testing or other environments.
admin.initializeApp();

const db = admin.firestore();

// Define the base path for user profiles to check roles
const getUserProfilePath = (appId: string, userId: string) => `artifacts/${appId}/users/${userId}/profile/data`;
// Define the base path for public salon data
const getSalonsCollectionPath = (appId: string) => `artifacts/${appId}/public/data/salons`;

/**
 * Helper function to verify if the caller is an authenticated administrator.
 * Throws an HttpsError if not authorized.
 */
async function assertAdmin(context: functions.https.CallableContext, appId: string) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = context.auth.uid;
  const userProfileRef = db.doc(getUserProfilePath(appId, userId));
  const userProfileSnap = await userProfileRef.get();

  if (!userProfileSnap.exists) {
    throw new functions.https.HttpsError('permission-denied', 'User profile not found.');
  }

  const userRole = userProfileSnap.data()?.role;
  if (userRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can perform this action.');
  }
}

/**
 * Callable Cloud Function to add a new salon.
 * Requires admin privileges.
 *
 * @param {object} data - The data for the new salon: { name: string, address: string, description: string, ownerId: string, appId: string }
 * @param {functions.https.CallableContext} context - The context of the function call.
 */
export const addSalon = functions.https.onCall(async (data, context) => {
  const { name, address, description, ownerId, appId } = data;

  // 1. Authenticate and authorize the caller as an admin
  await assertAdmin(context, appId);

  // 2. Validate input data
  if (!name || !address || !description || !ownerId || !appId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required salon fields.');
  }

  try {
    // 3. Add the salon document to Firestore
    const newSalonRef = await db.collection(getSalonsCollectionPath(appId)).add({
      name,
      address,
      description,
      ownerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Add timestamp
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Optional: Update the owner's global role to 'salon' if they are currently 'user'
    // This ensures they are redirected to the salon dashboard on next login.
    const ownerProfileRef = db.doc(getUserProfilePath(appId, ownerId));
    const ownerProfileSnap = await ownerProfileRef.get();

    if (ownerProfileSnap.exists && ownerProfileSnap.data()?.role === 'user') {
      await ownerProfileRef.update({ role: 'salon' });
      console.log(`Updated owner ${ownerId} role to 'salon' for new salon ${newSalonRef.id}`);
    } else if (!ownerProfileSnap.exists) {
      // If the owner profile doesn't exist, it means they might not have logged in yet.
      // You might want to create a default profile for them here, or rely on AuthContext.
      console.warn(`Owner profile for UID ${ownerId} not found when adding salon. Role not updated.`);
    }

    return { id: newSalonRef.id, message: 'Salon added successfully!' };
  } catch (error: any) {
    console.error("Error adding salon in Cloud Function:", error);
    throw new functions.https.HttpsError('internal', 'Failed to add salon.', error.message);
  }
});

/**
 * Callable Cloud Function to update an existing salon.
 * Requires admin privileges.
 *
 * @param {object} data - The update data: { id: string, name?: string, address?: string, description?: string, ownerId?: string, appId: string }
 * @param {functions.https.CallableContext} context - The context of the function call.
 */
export const updateSalon = functions.https.onCall(async (data, context) => {
  const { id, name, address, description, ownerId, appId } = data;

  // 1. Authenticate and authorize the caller as an admin
  await assertAdmin(context, appId);

  // 2. Validate input data
  if (!id || !appId || (!name && !address && !description && !ownerId)) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing salon ID or update fields.');
  }

  try {
    // 3. Update the salon document in Firestore
    const salonDocRef = db.doc(`${getSalonsCollectionPath(appId)}/${id}`);
    const updateData: { [key: string]: any } = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (description) updateData.description = description;
    if (ownerId) updateData.ownerId = ownerId;

    await salonDocRef.update(updateData);

    // Optional: If ownerId was changed, you might want to update roles for old/new owners
    // This logic can become complex depending on your requirements.
    // For simplicity, we're only updating the salon document itself here.

    return { message: 'Salon updated successfully!' };
  } catch (error: any) {
    console.error("Error updating salon in Cloud Function:", error);
    throw new functions.https.HttpsError('internal', 'Failed to update salon.', error.message);
  }
});

/**
 * Callable Cloud Function to delete a salon.
 * Requires admin privileges.
 *
 * @param {object} data - The data containing the salon ID: { id: string, appId: string }
 * @param {functions.https.CallableContext} context - The context of the function call.
 */
export const deleteSalon = functions.https.onCall(async (data, context) => {
  const { id, appId } = data;

  // 1. Authenticate and authorize the caller as an admin
  await assertAdmin(context, appId);

  // 2. Validate input data
  if (!id || !appId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing salon ID.');
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
    throw new functions.https.HttpsError('internal', 'Failed to delete salon.', error.message);
  }
});
