// functions/src/salons/addSalon.ts

import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { db, authAdmin, FieldValueAdmin, assertAdmin, getUserProfilePath, getSalonsCollectionPath } from '../utils/firebaseAdmin';
import { AddSalonData } from '../types';
/**
 * Callable Cloud Function to add a new salon.
 * Requires admin privileges.
 * Assigns ownership via owner's email.
 *
 * @param {CallableRequest<AddSalonData>} request - The request object containing data and context.
 */
export const addSalon = onCall(async (request: CallableRequest<AddSalonData>) => {
  const { name, address, description, ownerEmail } = request.data;
  const appId = process.env.FIREBASE_APP_ID || 'default-app-id';

  await assertAdmin(request, appId);

  if (!name || !address || !description || !ownerEmail) {
    throw new HttpsError('invalid-argument', 'Missing required salon fields or owner email.');
  }

  let ownerId: string;
  try {
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
    const newSalonRef = await db.collection(getSalonsCollectionPath(appId)).add({
      name,
      address,
      description,
      ownerId,
      createdAt: FieldValueAdmin.serverTimestamp(),
      updatedAt: FieldValueAdmin.serverTimestamp(),
    });

    const ownerProfileRef = db.doc(getUserProfilePath(appId, ownerId));
    const ownerProfileSnap = await ownerProfileRef.get();

    if (ownerProfileSnap.exists && ownerProfileSnap.data()?.role === 'user') {
      await ownerProfileRef.update({ role: 'salon' });
      console.log(`Updated owner ${ownerId} role to 'salon' for new salon ${newSalonRef.id}`);
    } else if (!ownerProfileSnap.exists) {
      await ownerProfileRef.set({
        email: ownerEmail,
        role: 'salon',
        createdAt: FieldValueAdmin.serverTimestamp(),
      }, { merge: true });
      console.log(`Created default 'salon' profile for new owner ${ownerId}.`);
    }

    console.log(`Invitation to manage salon ${name} could be sent to ${ownerEmail}.`);
    return { id: newSalonRef.id, message: 'Salon added successfully!' };
  } catch (error: any) {
    console.error("Error adding salon in Cloud Function:", error);
    throw new HttpsError('internal', 'Failed to add salon.', error.message);
  }
});