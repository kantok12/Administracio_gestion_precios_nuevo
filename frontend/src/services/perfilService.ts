import axios from 'axios';
import { CostoPerfilData } from '../types';

// Base URL for your backend API
// Make sure this matches how your backend server is running
// For development, it might be something like http://localhost:5000/api
// Adjust if your backend is on a different port or path
const API_URL = '/api/perfiles'; // Using relative path, assumes frontend/backend on same origin or proxy configured
const API_BASE_URL = '/api'; // Assuming this is the base URL for the backend

/**
 * Fetches a single profile by its ID.
 * @param id The ID of the profile to fetch.
 * @returns Promise resolving to the profile data.
 */
export const getPerfilById = async (id: string): Promise<CostoPerfilData> => {
  console.log(`[PerfilService] Fetching profile by ID: ${id}`);
  try {
    const response = await axios.get<CostoPerfilData>(`${API_URL}/${id}`);
    console.log(`[PerfilService] Profile ${id} fetched successfully.`);
    return response.data;
  } catch (error) {
    console.error(`[PerfilService] Error fetching profile ${id}:`, error);
    // Aquí podrías manejar el error específicamente (ej. lanzar un error más específico)
    throw error; // Re-lanzar para que el componente lo maneje
  }
};

/**
 * Updates an existing profile by its ID.
 * @param id The ID of the profile to update.
 * @param data The partial data containing fields to update (likely just 'costos').
 * @returns Promise resolving to the updated profile data.
 */
export const updatePerfil = async (id: string, data: Partial<CostoPerfilData>): Promise<CostoPerfilData> => {
  console.log(`[PerfilService] Updating profile ID: ${id}`);
  try {
    const response = await axios.put<CostoPerfilData>(`${API_URL}/${id}`, data);
    console.log(`[PerfilService] Profile ${id} updated successfully.`);
    return response.data;
  } catch (error) {
    console.error(`[PerfilService] Error updating profile ${id}:`, error);
    throw error;
  }
};

// Optional: Add function to get all profiles if needed elsewhere
export const getPerfiles = async (): Promise<CostoPerfilData[]> => {
  console.log('[PerfilService] Fetching all profiles...');
  try {
    const response = await axios.get<CostoPerfilData[]>(API_URL);
    console.log(`[PerfilService] Fetched ${response.data.length} profiles.`);
    return response.data;
  } catch (error) {
    console.error('[PerfilService] Error fetching all profiles:', error);
    throw error;
  }
};

// Asegúrate que el endpoint exista y soporte POST para crear
export const createPerfil = async (data: Omit<CostoPerfilData, '_id' | 'createdAt' | 'updatedAt'>): Promise<CostoPerfilData> => {
  console.log('[PerfilService] Creating new profile...');
  try {
    // Usar la ruta del backend para crear perfiles (/api/costo-perfiles)
    const response = await axios.post<CostoPerfilData>(`${API_BASE_URL}/costo-perfiles`, data); // Usar API_BASE_URL y ruta correcta
    console.log(`[PerfilService] Profile created successfully with ID: ${response.data._id}`);
    return response.data;
  } catch (error) {
    console.error('[PerfilService] Error creating profile:', error);
    throw error;
  }
};

export const deletePerfil = async (id: string): Promise<{ message: string }> => {
  console.log(`[PerfilService] Deleting profile ID: ${id}`);
  try {
    const response = await axios.delete<{ message: string }>(`${API_URL}/${id}`);
    console.log(`[PerfilService] Profile ${id} deleted successfully.`);
    return response.data;
  } catch (error) {
    console.error(`[PerfilService] Error deleting profile ${id}:`, error);
    throw error;
  }
};

// Add other service functions related to profiles as needed (e.g., deletePerfil, createPerfil) 