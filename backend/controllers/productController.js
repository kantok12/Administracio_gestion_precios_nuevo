const { fetchAvailableProducts, fetchFilteredProducts, fetchCurrencyValues } = require('../utils/fetchProducts');
const fs = require('fs');
const path = require('path');

let cachedProducts = [];
let currencyCache = {
  dollar: {
    value: null,
    last_update: null,
    fecha: null
  },
  euro: {
    value: null,
    last_update: null,
    fecha: null
  }
};

const CACHE_FILE = path.join(__dirname, '../productsCache.json');

// Cargar cache desde disco al iniciar
if (fs.existsSync(CACHE_FILE)) {
  try {
    let data = fs.readFileSync(CACHE_FILE, 'utf-8');
    
    // Eliminar BOM (Byte Order Mark) si existe
    if (data.charCodeAt(0) === 0xFEFF) {
      data = data.substring(1);
      console.log('BOM detectado y eliminado del archivo JSON al iniciar');
    }
    
    // Otra forma de eliminar posibles caracteres problemáticos
    data = data.replace(/^\uFEFF/, '');
    data = data.trim();
    
    try {
      cachedProducts = JSON.parse(data);
      console.log(`Cache de productos cargado desde disco. ${cachedProducts.length} productos encontrados.`);
    } catch (parseError) {
      console.error(`Error al parsear JSON al iniciar: ${parseError.message}`);
      console.error(`Contenido problemático: "${data.substring(0, 50)}..."`);
      cachedProducts = [];
    }
  } catch (err) {
    console.error('Error al leer el cache de productos:', err);
    cachedProducts = [];
  }
}

// Función para actualizar automáticamente los valores de las divisas
const updateCurrencyValues = async () => {
  try {
    const currencyValues = await fetchCurrencyValues();
    if (currencyValues && Array.isArray(currencyValues) && currencyValues.length > 0) {
      const data = currencyValues[0];
      
      currencyCache.dollar.value = data.Valor_Dolar;
      currencyCache.euro.value = data.Valor_Euro;
      currencyCache.dollar.fecha = data.Fecha;
      currencyCache.euro.fecha = data.Fecha;
      currencyCache.dollar.last_update = new Date().toISOString();
      currencyCache.euro.last_update = new Date().toISOString();
      
      console.log('Currency values updated automatically at:', new Date().toISOString());
    }
  } catch (error) {
    console.error('Error in automatic currency update:', error.message);
  }
};

// Configurar actualización automática cada 24 horas
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
setInterval(updateCurrencyValues, TWENTY_FOUR_HOURS);

// Ejecutar la primera actualización inmediatamente
updateCurrencyValues();

const saveCacheToDisk = () => {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedProducts, null, 2), 'utf-8');
      //console.log('Cache de productos guardado en disco.');
    } else {
      //console.log('El archivo de cache ya existe. No se sobreescribe.');
    }
  } catch (err) {
    console.error('Error al guardar el cache de productos:', err);
  }
};

// @desc    Fetch products from webhook and cache them
// @route   GET /api/products/fetch
// @access  Public
const fetchProducts = async (req, res) => {
  try {
    const products = await fetchAvailableProducts();
    cachedProducts = products; // Cache the products
    saveCacheToDisk();
    res.status(200).json({ message: 'Products fetched and cached successfully', products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get cached products
// @route   GET /api/products
// @access  Public
const getCachedProducts = (req, res) => {
  res.status(200).json(cachedProducts);
};

// @desc    Fetch filtered products from webhook
// @route   GET /api/products/filter
// @access  Public
const fetchFilteredProductsController = async (req, res) => {
  try {
    const { codigo, modelo, categoria } = req.query;
    const query = { codigo, modelo, categoria };
    const products = await fetchFilteredProducts(query);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch currency values from webhook and cache them
// @route   GET /api/currency/fetch
// @access  Public
const fetchCurrencyValuesController = async (req, res) => {
  try {
    const currencyValues = await fetchCurrencyValues();
    if (currencyValues && Array.isArray(currencyValues) && currencyValues.length > 0) {
      const data = currencyValues[0];
      
      currencyCache.dollar.value = data.Valor_Dolar;
      currencyCache.euro.value = data.Valor_Euro;
      currencyCache.dollar.fecha = data.Fecha;
      currencyCache.euro.fecha = data.Fecha;
      currencyCache.dollar.last_update = new Date().toISOString();
      currencyCache.euro.last_update = new Date().toISOString();

      res.status(200).json({ 
        message: 'Currency values fetched and cached successfully', 
        currencies: currencyCache 
      });
    } else {
      res.status(404).json({ message: 'No currency values found in response' });
    }
  } catch (error) {
    console.error('Error fetching currency values:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get cached dollar value
// @route   GET /api/currency/dollar
// @access  Public
const getCachedDollarValue = (req, res) => {
  if (currencyCache.dollar.value) {
    res.status(200).json({
      value: currencyCache.dollar.value,
      fecha: currencyCache.dollar.fecha,
      last_update: currencyCache.dollar.last_update
    });
  } else {
    res.status(404).json({ message: 'Dollar value not cached yet' });
  }
};

// @desc    Get cached euro value
// @route   GET /api/currency/euro
// @access  Public
const getCachedEuroValue = (req, res) => {
  if (currencyCache.euro.value) {
    res.status(200).json({
      value: currencyCache.euro.value,
      fecha: currencyCache.euro.fecha,
      last_update: currencyCache.euro.last_update
    });
  } else {
    res.status(404).json({ message: 'Euro value not cached yet' });
  }
};

// Función para leer productos desde el archivo
const readProductsFromFile = () => {
  try {
    console.log(`Intentando leer archivo: ${CACHE_FILE}`);
    
    if (!fs.existsSync(CACHE_FILE)) {
      console.log(`⚠️ Archivo no encontrado: ${CACHE_FILE}`);
      return [];
    }
    
    let data = fs.readFileSync(CACHE_FILE, 'utf-8');
    
    // Eliminar BOM (Byte Order Mark) si existe
    if (data.charCodeAt(0) === 0xFEFF) {
      data = data.substring(1);
      console.log('BOM detectado y eliminado del archivo JSON');
    }
    
    // Otra forma de eliminar posibles caracteres problemáticos al inicio
    data = data.replace(/^\uFEFF/, '');
    data = data.trim();
    
    console.log(`✅ Archivo leído correctamente, tamaño: ${data.length} bytes`);
    console.log(`Primeros 20 caracteres: "${data.substring(0, 20)}"`);
    
    try {
      const products = JSON.parse(data);
      console.log(`✅ JSON parseado correctamente, contiene ${products.length} productos`);
      return products;
    } catch (parseError) {
      console.error(`❌ Error al parsear JSON: ${parseError.message}`);
      console.error(`Contenido problemático: "${data.substring(0, 50)}..."`);
      return [];
    }
  } catch (err) {
    console.error(`❌ Error al leer archivo: ${err.message}`);
    return [];
  }
};

// @desc    Get all cached values
// @route   GET /api/products/cache/all
// @access  Public
const getAllCachedValues = (req, res) => {
  // Leer productos directamente del archivo en cada petición
  const productsFromFile = readProductsFromFile();

  const cache = {
    currencies: currencyCache,
    products: {
      total: productsFromFile.length,
      data: productsFromFile
    }
  };
  
  console.log(`Enviando respuesta al frontend con ${productsFromFile.length} productos`);
  res.status(200).json(cache);
};

// @desc    Reset all cache and fetch fresh data
// @route   POST /api/products/cache/reset
// @access  Public
const resetCache = async (req, res) => {
  try {
    // Limpiar caché actual
    cachedProducts = [];
    currencyCache = {
      dollar: { value: null, last_update: null, fecha: null },
      euro: { value: null, last_update: null, fecha: null }
    };

    // Obtener nuevos datos de divisas
    const currencyValues = await fetchCurrencyValues();
    if (currencyValues && currencyValues.length > 0) {
      const data = currencyValues[0];
      
      currencyCache.dollar.value = data.Valor_Dolar;
      currencyCache.euro.value = data.Valor_Euro;
      currencyCache.dollar.fecha = data.Fecha;
      currencyCache.euro.fecha = data.Fecha;
      currencyCache.dollar.last_update = new Date().toISOString();
      currencyCache.euro.last_update = new Date().toISOString();
    }

    // Obtener nuevos datos de productos
    const products = await fetchAvailableProducts();
    cachedProducts = products;
    saveCacheToDisk();
    res.status(200).json({
      message: 'Cache reset successfully',
      cache: {
        currencies: currencyCache,
        products: {
          total: cachedProducts.length,
          data: cachedProducts
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear all cache
// @route   DELETE /api/products/cache
// @access  Public
const clearCache = async (req, res) => {
  try {
    cachedProducts = [];
    currencyCache = {
      dollar: { value: null, last_update: null, fecha: null },
      euro: { value: null, last_update: null, fecha: null }
    };
    saveCacheToDisk();
    res.status(200).json({
      message: 'Cache cleared successfully',
      cache: {
        currencies: currencyCache,
        products: {
          total: 0,
          data: []
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  fetchProducts, 
  getCachedProducts, 
  fetchFilteredProductsController, 
  fetchCurrencyValuesController, 
  getCachedDollarValue, 
  getCachedEuroValue,
  getAllCachedValues,
  resetCache,
  clearCache 
};