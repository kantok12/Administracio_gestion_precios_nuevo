import axios from 'axios';
import { CostoPerfilData } from '../types';

// Base URL for the backend API
// const API_URL = '/api/perfiles'; // REMOVE this old constant
const API_BASE_URL = '/api'; // Use this for constructing the full path
const PROFILES_ENDPOINT = `${API_BASE_URL}/costo-perfiles`; // Define the correct endpoint path

/**
 * Fetches a single profile by its ID.
 * @param id The ID of the profile to fetch.
 * @returns Promise resolving to the profile data.
 */
export const getPerfilById = async (id: string): Promise<CostoPerfilData> => {
  console.log(`[PerfilService] Fetching profile by ID: ${id}`);
  try {
    // Use the correct endpoint
    const response = await axios.get<CostoPerfilData>(`${PROFILES_ENDPOINT}/${id}`);
    console.log(`[PerfilService] Profile ${id} fetched successfully.`);
    return response.data;
  } catch (error) {
    console.error(`[PerfilService] Error fetching profile ${id}:`, error);
    throw error; 
  }
};

/**
 * Updates an existing profile by its ID.
 * @param id The ID of the profile to update.
 * @param data The partial data containing fields to update.
 * @returns Promise resolving to the updated profile data.
 */
export const updatePerfil = async (id: string, data: Partial<CostoPerfilData>): Promise<CostoPerfilData> => {
  console.log(`[PerfilService] Updating profile ID: ${id}`);
  try {
    // Use the correct endpoint
    const response = await axios.put<CostoPerfilData>(`${PROFILES_ENDPOINT}/${id}`, data);
    console.log(`[PerfilService] Profile ${id} updated successfully.`);
    return response.data;
  } catch (error) {
    console.error(`[PerfilService] Error updating profile ${id}:`, error);
    throw error;
  }
};

// Function to get all profiles
export const getPerfiles = async (): Promise<CostoPerfilData[]> => {
  console.log('[PerfilService] Fetching all profiles...');
  try {
    // Use the correct endpoint
    const response = await axios.get<CostoPerfilData[]>(PROFILES_ENDPOINT);
    console.log(`[PerfilService] Fetched ${response.data.length} profiles.`);
    return response.data;
  } catch (error) {
    console.error('[PerfilService] Error fetching all profiles:', error);
    throw error;
  }
};

// Function to create a new profile
export const createPerfil = async (data: Omit<CostoPerfilData, '_id' | 'createdAt' | 'updatedAt'>): Promise<CostoPerfilData> => {
  console.log('[PerfilService] Creating new profile...');
  try {
    // Use the correct endpoint
    const response = await axios.post<CostoPerfilData>(PROFILES_ENDPOINT, data); 
    console.log(`[PerfilService] Profile created successfully with ID: ${response.data._id}`);
    return response.data;
  } catch (error) {
    console.error('[PerfilService] Error creating profile:', error);
    throw error;
  }
};

// Function to delete a profile
export const deletePerfil = async (id: string): Promise<{ message: string }> => {
  console.log(`[PerfilService] Deleting profile ID: ${id}`);
  try {
    // Use the correct endpoint
    const response = await axios.delete<{ message: string }>(`${PROFILES_ENDPOINT}/${id}`);
    console.log(`[PerfilService] Profile ${id} deleted successfully.`);
    return response.data;
  } catch (error) {
    console.error(`[PerfilService] Error deleting profile ${id}:`, error);
    throw error;
  }
};

// Add other service functions related to profiles as needed (e.g., deletePerfil, createPerfil) 