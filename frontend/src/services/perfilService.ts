import axios from 'axios';
import { PricingOverrideData } from '../types';

// Base URL for your backend API
// Make sure this matches how your backend server is running
// For development, it might be something like http://localhost:5000/api
// Adjust if your backend is on a different port or path
const API_URL = '/api/perfiles'; // Using relative path, assumes frontend/backend on same origin or proxy configured

/**
 * Fetches a single profile by its ID.
 * @param id The ID of the profile to fetch.
 * @returns Promise resolving to the profile data.
 */
export const getPerfilById = async (id: string): Promise<PricingOverrideData> => {
  console.log(`[perfilService] Fetching profile by ID: ${id}`);
  try {
    const response = await axios.get<PricingOverrideData>(`${API_URL}/${id}`);
    console.log(`[perfilService] Profile data received for ${id}:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[perfilService] Error fetching profile ${id}:`, error.response?.data || error.message);
    // Re-throw the error so the component can catch it
    throw error.response?.data || new Error('Error al obtener el perfil de la API');
  }
};

/**
 * Updates an existing profile by its ID.
 * @param id The ID of the profile to update.
 * @param data The partial data containing fields to update (likely just 'costos').
 * @returns Promise resolving to the updated profile data.
 */
export const updatePerfil = async (id: string, data: Partial<PricingOverrideData>): Promise<PricingOverrideData> => {
  console.log(`[perfilService] Updating profile ${id} with data:`, data);
  try {
    const response = await axios.put<PricingOverrideData>(`${API_URL}/${id}`, data);
    console.log(`[perfilService] Profile ${id} updated successfully:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[perfilService] Error updating profile ${id}:`, error.response?.data || error.message);
    // Re-throw the error so the component can catch it
    throw error.response?.data || new Error('Error al actualizar el perfil en la API');
  }
};

// Optional: Add function to get all profiles if needed elsewhere
export const getPerfiles = async (): Promise<PricingOverrideData[]> => {
    console.log(`[perfilService] Fetching all profiles`);
    try {
        const response = await axios.get<PricingOverrideData[]>(API_URL);
        console.log(`[perfilService] All profiles received:`, response.data.length);
        return response.data;
    } catch (error: any) {
        console.error(`[perfilService] Error fetching all profiles:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Error al obtener todos los perfiles de la API');
    }
};

// Add other service functions related to profiles as needed (e.g., deletePerfil, createPerfil) 