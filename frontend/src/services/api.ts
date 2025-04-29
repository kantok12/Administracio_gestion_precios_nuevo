import axios from 'axios';
import type { Producto } from "../types/product";
import type { CurrencyData } from "../types/currency";
import { CostoPerfilData, ProductoData } from '../types';

// Establecer URL base según entorno
const API_URL = 'http://localhost:3000/api';

// Instancia de axios con configuración común
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Si no hay respuesta del servidor o es un error de red
    if (!error.response) {
      return Promise.reject({
        message: 'Error de conexión. Verifique su conexión a internet o inténtelo más tarde.',
      });
    }
    
    // Si hay un error de servidor
    if (error.response.status >= 500) {
      return Promise.reject({
        message: 'Error en el servidor. Por favor, inténtelo más tarde.',
      });
    }
    
    // Otros errores
    return Promise.reject(error);
  }
);

// Crear datos de prueba para desarrollo
const mockProducts = {
  total: 5,
  data: [
    {
      codigo_producto: '61103',
      nombre_del_producto: 'Chipeadora PTO A141XL',
      Descripcion: 'Chipeadora de construcción fija, con requerimiento de potencia de 82 [HP]',
      Modelo: 'A141XL',
      categoria: 'Chipeadora PTO',
      pf_eur: '8500',
      dimensiones: '410x300mm',
    },
    {
      codigo_producto: '61166',
      nombre_del_producto: 'Chipeadora Motor A141XL',
      Descripcion: 'Chipeadora con mesa giratoria en 270°, con motor diésel',
      Modelo: 'A141XL - 75 HP',
      categoria: 'Chipeadora Motor',
      pf_eur: '12500',
      dimensiones: '410x300mm',
    },
    {
      codigo_producto: '61134',
      nombre_del_producto: 'Chipeadora PTO A141XL Chasis 25km/h',
      Descripcion: 'Chipeadora de construcción fija, con requerimiento de potencia de 82 [HP]',
      Modelo: 'A141XL - Chasis 25km/h',
      categoria: 'Chipeadora PTO',
      pf_eur: '9800',
      dimensiones: '410x300mm',
    },
    {
      codigo_producto: '61135',
      nombre_del_producto: 'Chipeadora PTO A141XL Chasis 80km/h',
      Descripcion: 'Chipeadora de construcción fija, con requerimiento de potencia de 82 [HP]',
      Modelo: 'A141XL - Chasis 80km/h',
      categoria: 'Chipeadora PTO',
      pf_eur: '10500',
      dimensiones: '410x300mm',
    },
    {
      codigo_producto: '61201',
      nombre_del_producto: 'Chipeadora PTO A231',
      Descripcion: 'Chipeadora de construcción fija, con requerimiento de potencia de 75 [HP]',
      Modelo: 'A231 - 3 Puntos',
      categoria: 'Chipeadora PTO',
      pf_eur: '7500',
      dimensiones: '310x240mm',
    },
  ],
};

const mockCurrencies = {
  currencies: {
    dollar: {
      value: '983.27',
      last_update: new Date().toISOString(),
    },
    euro: {
      value: '1085.15',
      last_update: new Date().toISOString(),
    },
  },
};

// Funciones de API
export const getCachedProducts = async (): Promise<{total: number, data: Producto[]}> => {
  console.log('Fetching products...');
  try {
    // Intenta obtener datos del backend real
    const response = await apiClient.get('/products');
    console.log('Products fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching products, using mock data:', error);
    // Si hay un error, usa datos de prueba
    return mockProducts;
  }
};

export const getCurrencies = async (): Promise<CurrencyData> => {
  console.log('Fetching currencies...');
  try {
    // Intenta obtener datos del backend real
    const response = await apiClient.get('/currencies');
    console.log('Currencies fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching currencies, using mock data:', error);
    // Si hay un error, usa datos de prueba
    return mockCurrencies;
  }
};

export const getProducts = async (): Promise<Producto[]> => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};

export const getDollarValue = async () => {
  const response = await axios.get(`${API_URL}/products/currency/dollar`);
  return response.data;
};

export const getEuroValue = async () => {
  const response = await axios.get(`${API_URL}/products/currency/euro`);
  return response.data;
};

const API_BASE_URL = 'http://localhost:5001/api';

// --- Funciones relacionadas con Perfiles de Costo ---

const fetchAllProfiles = async (): Promise<CostoPerfilData[]> => {
  try {
    const response = await axios.get<CostoPerfilData[]>(`${API_BASE_URL}/perfiles`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all cost profiles:', error);
    throw error; // Re-lanzar para manejo en el componente
  }
};

const fetchProfileData = async (profileId: string): Promise<CostoPerfilData | null> => {
  if (!profileId) return null;
  try {
    const response = await axios.get<CostoPerfilData>(`${API_BASE_URL}/perfiles/${profileId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching profile data for ID ${profileId}:`, error);
    // Devolver null o lanzar error según preferencia de manejo
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null; // No encontrado
    }
    throw error;
  }
};

const updateProfile = async (profileId: string, data: Partial<CostoPerfilData>): Promise<CostoPerfilData> => {
  try {
    const response = await axios.put<CostoPerfilData>(`${API_BASE_URL}/perfiles/${profileId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating profile ${profileId}:`, error);
    throw error;
  }
};

const createProfile = async (data: Omit<CostoPerfilData, '_id' | 'createdAt' | 'updatedAt'>): Promise<CostoPerfilData> => {
  try {
    // Asumiendo que tienes una ruta POST en /api/costo-perfiles o /api/perfiles
    // Ajusta la URL si es necesario (usaré /costo-perfiles como ejemplo)
    const response = await axios.post<CostoPerfilData>(`${API_BASE_URL}/costo-perfiles`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

const deleteProfile = async (profileId: string): Promise<{ message: string }> => {
  try {
    const response = await axios.delete<{ message: string }>(`${API_BASE_URL}/perfiles/${profileId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting profile ${profileId}:`, error);
    throw error;
  }
};

// --- Funciones relacionadas con Productos (Ejemplo) ---
const fetchAllProducts = async (): Promise<ProductoData[]> => {
  try {
    // Ajusta la ruta si es diferente
    const response = await axios.get<ProductoData[]>(`${API_BASE_URL}/products`); 
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Exportar las funciones
export const api = {
  // Perfiles
  fetchAllProfiles,
  fetchProfileData,
  updateProfile,
  createProfile,
  deleteProfile,
  // Productos (ejemplo)
  fetchAllProducts,
  // ... otras funciones API necesarias
};