"use strict";
// functions/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSalon = exports.updateSalon = exports.addSalon = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
// Securely derive the APP_ID from a Cloud Function environment variable.
// This variable MUST be set in your Firebase project configuration.
const APP_ID = functions.config().app_config.app_id;
// Define the base path for user profiles to check roles
const getUserProfilePath = (userId) => `artifacts/${APP_ID}/users/${userId}/profile/data`;
// Define the base path for public salon data
const getSalonsCollectionPath = () => `artifacts/${APP_ID}/public/data/salons`;
/**
 * Helper function to verify if the caller is an authenticated administrator.
 * Throws an HttpsError if not authorized.
 */
async function assertAdmin(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const userId = context.auth.uid;
    const userProfileRef = db.doc(getUserProfilePath(userId));
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
 * @param {object} data - The data for the new salon: { name: string, address: string, description: string, ownerId: string }
 * @param {functions.https.CallableContext} context - The context of the function call.
 */
exports.addSalon = functions.https.onCall(async (data, context) => {
    const { name, address, description, ownerId } = data;
    // 1. Authenticate and authorize the caller as an admin
    await assertAdmin(context);
    // 2. Validate input data
    if (!name || !address || !description || !ownerId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required salon fields.');
    }
    try {
        // 3. Add the salon document to Firestore
        const newSalonRef = await db.collection(getSalonsCollectionPath()).add({
            name,
            address,
            description,
            ownerId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Optional: Update the owner's global role to 'salon' if they are currently 'user'
        const ownerProfileRef = db.doc(getUserProfilePath(ownerId));
        const ownerProfileSnap = await ownerProfileRef.get();
        if (ownerProfileSnap.exists && ownerProfileSnap.data()?.role === 'user') {
            await ownerProfileRef.update({ role: 'salon' });
            console.log(`Updated owner ${ownerId} role to 'salon' for new salon ${newSalonRef.id}`);
        }
        else if (!ownerProfileSnap.exists) {
            console.warn(`Owner profile for UID ${ownerId} not found when adding salon. Role not updated.`);
        }
        return { id: newSalonRef.id, message: 'Salon added successfully!' };
    }
    catch (error) {
        console.error("Error adding salon in Cloud Function:", error);
        throw new functions.https.HttpsError('internal', 'Failed to add salon.', error.message);
    }
});
/**
 * Callable Cloud Function to update an existing salon.
 * Requires admin privileges.
 *
 * @param {object} data - The update data: { id: string, name?: string, address?: string, description?: string, ownerId?: string }
 * @param {functions.https.CallableContext} context - The context of the function call.
 */
exports.updateSalon = functions.https.onCall(async (data, context) => {
    const { id, name, address, description, ownerId } = data;
    // 1. Authenticate and authorize the caller as an admin
    await assertAdmin(context);
    // 2. Validate input data
    if (!id || (!name && !address && !description && !ownerId)) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing salon ID or update fields.');
    }
    try {
        // 3. Update the salon document in Firestore
        const salonDocRef = db.doc(`${getSalonsCollectionPath()}/${id}`);
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (name)
            updateData.name = name;
        if (address)
            updateData.address = address;
        if (description)
            updateData.description = description;
        if (ownerId)
            updateData.ownerId = ownerId;
        await salonDocRef.update(updateData);
        return { message: 'Salon updated successfully!' };
    }
    catch (error) {
        console.error("Error updating salon in Cloud Function:", error);
        throw new functions.https.HttpsError('internal', 'Failed to update salon.', error.message);
    }
});
/**
 * Callable Cloud Function to delete a salon.
 * Requires admin privileges.
 *
 * @param {object} data - The data containing the salon ID: { id: string }
 * @param {functions.https.CallableContext} context - The context of the function call.
 */
exports.deleteSalon = functions.https.onCall(async (data, context) => {
    const { id } = data;
    // 1. Authenticate and authorize the caller as an admin
    await assertAdmin(context);
    // 2. Validate input data
    if (!id) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing salon ID.');
    }
    try {
        // 3. Delete the salon document from Firestore
        const salonDocRef = db.doc(`${getSalonsCollectionPath()}/${id}`);
        await salonDocRef.delete();
        return { message: 'Salon deleted successfully!' };
    }
    catch (error) {
        console.error("Error deleting salon in Cloud Function:", error);
        throw new functions.https.HttpsError('internal', 'Failed to delete salon.', error.message);
    }
});
//# sourceMappingURL=index.js.map