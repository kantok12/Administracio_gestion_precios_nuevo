const { fetchAvailableProducts, fetchFilteredProducts, fetchCurrencyValues } = require('../utils/fetchProducts');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');

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

// Modificar la ruta para apuntar al nuevo archivo en la carpeta data
const CACHE_FILE = path.join(__dirname, '../data/productsCache.json');

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
  try {
    // Leer productos directamente del archivo en cada petición
    const productsFromFile = readProductsFromFile();
    
    // Estructura de respuesta estandarizada
    const response = {
      success: true,
      data: {
        currencies: currencyCache,
        products: {
          total: productsFromFile.length,
          data: productsFromFile
        }
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`Enviando respuesta al frontend con ${productsFromFile.length} productos`);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener valores del caché:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener valores del caché',
      message: error.message
    });
  }
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

// @desc    Get product detail from cache or webhook
// @route   GET /api/products/detail
// @access  Public
const getProductDetail = async (req, res) => {
  try {
    const { codigo, modelo, categoria } = req.query;

    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: 'Parámetros inválidos',
        message: 'El código del producto es requerido'
      });
    }

    // Primero buscar en el caché
    const productsFromCache = readProductsFromFile();
    const productFromCache = productsFromCache.find(p => p.codigo_producto === codigo);

    if (productFromCache) {
      console.log(`Producto encontrado en caché: ${codigo}`);
      return res.status(200).json({
        success: true,
        data: {
          source: 'cache',
          product: productFromCache
        },
        timestamp: new Date().toISOString()
      });
    }

    // Si no está en caché, consultar al webhook
    console.log(`Producto no encontrado en caché, consultando webhook: ${codigo}`);
    const query = { codigo, modelo, categoria };
    const products = await fetchFilteredProducts(query);

    if (products && products.length > 0) {
      const product = products[0];
      return res.status(200).json({
        success: true,
        data: {
          source: 'webhook',
          product
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Producto no encontrado',
      message: `No se encontró el producto con código ${codigo}`
    });

  } catch (error) {
    console.error('Error al obtener detalle del producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener detalle del producto',
      message: error.message
    });
  }
};

// @desc    Get optional products
// @route   GET /api/products/opcionales
// @access  Public
const getOptionalProducts = async (req, res) => {
  try {
    const { codigo, modelo, categoria } = req.query;

    if (!codigo || !modelo || !categoria) {
      return res.status(400).json({
        success: false,
        error: 'Parámetros inválidos',
        message: 'Se requieren los parámetros: codigo, modelo y categoria'
      });
    }

    // Loguear los parámetros para depuración
    console.log('Consultando productos opcionales con parámetros:', { codigo, modelo, categoria });

    const query = { codigo, modelo, categoria };
    
    try {
      const products = await fetchFilteredProducts(query);
      console.log(`Se encontraron ${products.length} productos opcionales`);
      
      return res.status(200).json({
        success: true,
        data: {
          total: products.length,
          products
        },
        timestamp: new Date().toISOString()
      });
    } catch (fetchError) {
      console.error('Error específico en fetchFilteredProducts:', fetchError);
      
      // Intentar con endpoint alternativo si está disponible
      try {
        console.log('Intentando obtener productos del caché como alternativa...');
        const cachedProducts = readProductsFromFile();
        
        // Filtrar productos relacionados por categoría
        const relatedProducts = cachedProducts.filter(p => p.categoria === categoria);
        
        console.log(`Se encontraron ${relatedProducts.length} productos relacionados en el caché`);
        
        return res.status(200).json({
          success: true,
          data: {
            total: relatedProducts.length,
            products: relatedProducts,
            source: 'cache'
          },
          message: 'Usando datos del caché como alternativa',
          timestamp: new Date().toISOString()
        });
      } catch (cacheError) {
        console.error('Error al intentar usar el caché como alternativa:', cacheError);
        throw fetchError; // Propagar el error original
      }
    }
  } catch (error) {
    console.error('Error al obtener productos opcionales:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener productos opcionales',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Modelo para la colección pricingOverrides
const PricingOverride = mongoose.model('PricingOverride', new mongoose.Schema({}, { strict: false }));

// Controlador para obtener todos los datos de la colección pricingOverrides
const getPricingOverrides = async (req, res) => {
  try {
    const data = await PricingOverride.find();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching pricingOverrides:', error);
    res.status(500).json({ message: 'Error fetching pricingOverrides', error: error.message });
  }
};

const createIndividualEquipment = async (req, res) => {
  try {
    const equipmentData = req.body;

    // Validate required fields
    const requiredFields = [
      'Codigo_Producto',
      'nombre_del_producto',
      'modelo',
      'categoria',
      'largo_cm',
      'ancho_cm',
      'alto_cm',
      'peso_kg',
      'linea_de_producto',
      'combustible',
      'hp',
      'clasificacion_easysystems',
      'codigo_ea',
      'proveedor',
      'procedencia'
    ];

    for (const field of requiredFields) {
      if (!equipmentData[field]) {
        return res.status(400).json({ 
          message: `El campo ${field} es requerido`,
          field: field
        });
      }
    }

    // Validate numeric fields
    const numericFields = ['largo_cm', 'ancho_cm', 'alto_cm', 'peso_kg', 'hp'];
    for (const field of numericFields) {
      if (isNaN(Number(equipmentData[field]))) {
        return res.status(400).json({ 
          message: `El campo ${field} debe ser un número`,
          field: field
        });
      }
    }

    // TODO: Add database integration here
    // For now, just return success
    res.status(201).json({
      message: 'Equipo creado exitosamente',
      data: equipmentData
    });

  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({ 
      message: 'Error al crear el equipo',
      error: error.message 
    });
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
  clearCache,
  getProductDetail,
  getOptionalProducts,
  getPricingOverrides,
  createIndividualEquipment
};