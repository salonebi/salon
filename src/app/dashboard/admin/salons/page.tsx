// src/app/dashboard/admin/salons/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc } from 'firebase/firestore';
import { db, app } from '../../../../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { Salon, CallableResult } from '../../../../types'; // Import CallableResult

// Initialize Firebase Functions client
const functions = getFunctions(app);
// Specify the expected output type for httpsCallable
const addSalonCallable = httpsCallable<any, CallableResult>(functions, 'addSalon');
const updateSalonCallable = httpsCallable<any, CallableResult>(functions, 'updateSalon');
const deleteSalonCallable = httpsCallable<any, CallableResult>(functions, 'deleteSalon');

// Client-side appId for direct Firestore reads (if not via callable functions)
const clientAppId = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'default-app-id'; // Corrected environment variable

/**
 * AdminSalonsPage component.
 * Allows administrators to manage (create, list, edit, delete) salon records via Cloud Functions.
 */
const AdminSalonsPage = () => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for the new salon form
  const [newSalonName, setNewSalonName] = useState<string>('');
  const [newSalonAddress, setNewSalonAddress] = useState<string>('');
  const [newSalonDescription, setNewSalonDescription] = useState<string>('');
  const [newSalonOwnerId, setNewSalonOwnerId] = useState<string>(''); // User ID of the salon owner

  // State for editing a salon
  const [editingSalonId, setEditingSalonId] = useState<string | null>(null);
  const [editSalonName, setEditSalonName] = useState<string>('');
  const [editSalonAddress, setEditSalonAddress] = useState<string>('');
  const [editSalonDescription, setEditSalonDescription] = useState<string>('');
  const [editSalonOwnerId, setEditSalonOwnerId] = useState<string>('');

  useEffect(() => {
    fetchSalons();
  }, []);

  /**
   * Fetches all salon documents directly from Firestore (read operation).
   * For read operations that don't modify data, direct client access can be fine with proper security rules.
   */
  const fetchSalons = async () => {
    setLoading(true);
    setError(null);
    try {
      const salonsCollectionRef = collection(db, `artifacts/${clientAppId}/public/data/salons`);
      const querySnapshot = await getDocs(salonsCollectionRef);
      const fetchedSalons: Salon[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        address: doc.data().address,
        description: doc.data().description,
        ownerId: doc.data().ownerId,
      }));
      setSalons(fetchedSalons);
    } catch (err: any) {
      console.error("Error fetching salons:", err);
      setError(`Failed to load salons: ${err.message}`);
      toast.error(`Failed to load salons: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles adding a new salon via Cloud Function.
   */
  const handleAddSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalonName || !newSalonAddress || !newSalonDescription || !newSalonOwnerId) {
      toast.error("Please fill in all fields for the new salon.");
      return;
    }

    setLoading(true);
    try {
      // Call the Cloud Function instead of direct Firestore addDoc
      const result = await addSalonCallable({
        name: newSalonName,
        address: newSalonAddress,
        description: newSalonDescription,
        ownerId: newSalonOwnerId,
        // appId is NOT sent from client; it's derived securely on the backend
      });
      toast.success(result.data.message);
      setNewSalonName('');
      setNewSalonAddress('');
      setNewSalonDescription('');
      setNewSalonOwnerId('');
      fetchSalons(); // Refresh the list
    } catch (err: any) {
      console.error("Error adding salon:", err);
      toast.error(`Failed to add salon: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sets the state for editing a specific salon.
   */
  const startEditing = (salon: Salon) => {
    setEditingSalonId(salon.id);
    setEditSalonName(salon.name);
    setEditSalonAddress(salon.address);
    setEditSalonDescription(salon.description);
    setEditSalonOwnerId(salon.ownerId);
  };

  /**
   * Handles updating an existing salon via Cloud Function.
   */
  const handleUpdateSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalonId || !editSalonName || !editSalonAddress || !editSalonDescription || !editSalonOwnerId) {
      toast.error("Please fill in all fields for editing.");
      return;
    }

    setLoading(true);
    try {
      // Call the Cloud Function instead of direct Firestore updateDoc
      const result = await updateSalonCallable({
        id: editingSalonId,
        name: editSalonName,
        address: editSalonAddress,
        description: editSalonDescription,
        ownerId: editSalonOwnerId,
        // appId is NOT sent from client
      });
      toast.success(result.data.message);
      setEditingSalonId(null); // Exit editing mode
      fetchSalons(); // Refresh the list
    } catch (err: any) {
      console.error("Error updating salon:", err);
      toast.error(`Failed to update salon: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles deleting a salon via Cloud Function.
   */
  const handleDeleteSalon = async (salonId: string) => {
    if (window.confirm("Are you sure you want to delete this salon? This action cannot be undone.")) {
      setLoading(true);
      try {
        // Call the Cloud Function instead of direct Firestore deleteDoc
        const result = await deleteSalonCallable({ id: salonId }); // appId is NOT sent from client
        toast.success(result.data.message);
        fetchSalons(); // Refresh the list
      } catch (err: any) {
        console.error("Error deleting salon:", err);
        toast.error(`Failed to delete salon: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p className="text-lg">Loading salons for admin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 p-4 rounded-lg shadow-md">
        <p className="text-lg font-semibold">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 space-y-8 border border-gray-200 dark:border-gray-700">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 text-center mb-6">
          Admin: Manage Salons
        </h1>

        {/* Add New Salon Form */}
        <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Add New Salon</h2>
          <form onSubmit={handleAddSalon} className="space-y-4">
            <div>
              <label htmlFor="newSalonName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Salon Name
              </label>
              <input
                type="text"
                id="newSalonName"
                value={newSalonName}
                onChange={(e) => setNewSalonName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="newSalonAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
              <input
                type="text"
                id="newSalonAddress"
                value={newSalonAddress}
                onChange={(e) => setNewSalonAddress(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="newSalonDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="newSalonDescription"
                value={newSalonDescription}
                onChange={(e) => setNewSalonDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 p-2"
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="newSalonOwnerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Owner User ID (Firebase UID)
              </label>
              <input
                type="text"
                id="newSalonOwnerId"
                value={newSalonOwnerId}
                onChange={(e) => setNewSalonOwnerId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 p-2"
                placeholder="e.g., MFIh8kIzlQhoDnOcjshbjP3AQjF2"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-sm transition duration-300 ease-in-out"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Salon'}
            </button>
          </form>
        </div>

        {/* Salon List */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">Existing Salons</h2>
          {salons.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400">No salons registered yet.</p>
          ) : (
            <ul className="space-y-4">
              {salons.map((salon) => (
                <li key={salon.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  {editingSalonId === salon.id ? (
                    <form onSubmit={handleUpdateSalon} className="w-full space-y-2">
                      <input
                        type="text"
                        value={editSalonName}
                        onChange={(e) => setEditSalonName(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 p-2"
                        required
                      />
                      <input
                        type="text"
                        value={editSalonAddress}
                        onChange={(e) => setEditSalonAddress(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 p-2"
                        required
                      />
                      <textarea
                        value={editSalonDescription}
                        onChange={(e) => setEditSalonDescription(e.target.value)}
                        rows={2}
                        className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 p-2"
                        required
                      ></textarea>
                      <input
                        type="text"
                        value={editSalonOwnerId}
                        onChange={(e) => setEditSalonOwnerId(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 p-2"
                        placeholder="Owner User ID"
                        required
                      />
                      <div className="flex space-x-2 mt-2">
                        <button
                          type="submit"
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition duration-300"
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSalonId(null)}
                          className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm transition duration-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{salon.name}</h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{salon.address}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Owner ID: {salon.ownerId}</p>
                      </div>
                      <div className="mt-2 sm:mt-0 flex space-x-2">
                        <button
                          onClick={() => startEditing(salon)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition duration-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSalon(salon.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition duration-300"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSalonsPage;