const axios = require('axios');

/**
 * Obtiene todos los productos disponibles.
 * Webhook: /webhook/6f697684-4cfc-4bc1-8918-bfffc9f20b9f
 * Método: GET
 * Retorna: Array de productos.
 */
const fetchAvailableProducts = async () => {
  try {
    const response = await axios.get('https://n8n-807184488368.southamerica-west1.run.app/webhook/6f697684-4cfc-4bc1-8918-bfffc9f20b9f');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
};

/**
 * Obtiene productos filtrados según los parámetros de consulta.
 * Webhook: /webhook/ac8b70a7-6be5-4e1a-87b3-3813464dd254
 * Método: GET
 * Parámetros: query (filtros de búsqueda)
 * Retorna: Array de productos filtrados.
 */
const fetchFilteredProducts = async (query) => {
  try {
    const response = await axios.get('https://n8n-807184488368.southamerica-west1.run.app/webhook/ac8b70a7-6be5-4e1a-87b3-3813464dd254', {
      params: query,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered products:', error);
    throw new Error('Failed to fetch filtered products');
  }
};

/**
 * Obtiene el valor actual del dólar.
 * Webhook: /webhook/8012d60e-8a29-4910-b385-6514edc3d912
 * Método: GET
 * Retorna: Objeto con el valor del dólar.
 */
const fetchDollarValue = async () => {
  try {
    const response = await axios.get('https://n8n-807184488368.southamerica-west1.run.app/webhook/8012d60e-8a29-4910-b385-6514edc3d912');
    return response.data;
  } catch (error) {
    console.error('Error fetching dollar value:', error);
    throw new Error('Failed to fetch dollar value');
  }
};

/**
 * Obtiene los valores actuales de dólar y euro, junto con la fecha.
 * Webhook: /webhook/8012d60e-8a29-4910-b385-6514edc3d912
 * Método: GET
 * Retorna: Array con un objeto que contiene Valor_Dolar, Valor_Euro y Fecha.
 */
const fetchCurrencyValues = async () => {
  try {
    console.log('Fetching currency values from webhook...');
    const response = await axios.get('https://n8n-807184488368.southamerica-west1.run.app/webhook/8012d60e-8a29-4910-b385-6514edc3d912');
    
    console.log('Webhook response:', response.data);
    
    // Validar que la respuesta contenga los campos necesarios
    if (!response.data || !response.data.Valor_Dolar || !response.data.Valor_Euro || !response.data.Fecha) {
      console.error('Missing required fields in response:', response.data);
      throw new Error('Missing required currency fields in response');
    }

    // Convertir el objeto a array para mantener consistencia con el resto del código
    return [response.data];
  } catch (error) {
    console.error('Error in fetchCurrencyValues:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error(`Failed to fetch currency values: ${error.message}`);
  }
};

module.exports = { fetchAvailableProducts, fetchFilteredProducts, fetchDollarValue, fetchCurrencyValues };