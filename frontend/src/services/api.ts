import axios from 'axios';
import { Product } from '../types/product';
import { CurrencyData } from '../types/currency';

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
export const getCachedProducts = async (): Promise<{total: number, data: Product[]}> => {
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

export const getProducts = async (): Promise<Product[]> => {
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

export const api = {
  // Divisas
  fetchCurrencies: async () => {
    const response = await fetch('https://n8n-807184488368.southamerica-west1.run.app/webhook/8012d60e-8a29-4910-b385-6514edc3d912');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // Parámetros Globales
  fetchGlobalParams: async () => {
    const response = await fetch(`${API_BASE_URL}/category-overrides/global`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  updateGlobalParams: async (params: { costos: any }) => {
    const response = await fetch(`${API_BASE_URL}/category-overrides/global`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // Parámetros por Categoría
  fetchCategoryParams: async (categoryId: string) => {
    const response = await fetch(`${API_BASE_URL}/category-overrides/${categoryId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  updateCategoryParams: async (categoryId: string, params: { costos: any }) => {
    const response = await fetch(`${API_BASE_URL}/category-overrides/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  // Actualizar Divisas en el Backend
  updateCurrenciesInDB: async (params: { dolar_observado_actual: number, euro_observado_actual?: number }) => {
    console.log('[API Service] Updating currencies in DB with params:', params);
    const response = await fetch(`${API_BASE_URL}/category-overrides/global`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          costos: params
      })
    });
    console.log(`[API Service] Update currencies response status: ${response.status}`);
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[API Service] Update currencies failed: ${response.status}`, errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    console.log('[API Service] Update currencies success response:', result);
    return result;
  }
};