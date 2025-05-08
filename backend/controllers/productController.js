const { fetchFilteredProducts, fetchCurrencyValues } = require('../utils/fetchProducts');
const { fetchBaseProductsFromDB, createProductInDB, getProductByCodeFromDB, updateProductInDB, deleteProductFromDB } = require('../utils/mongoDataService');
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
    // fetchCurrencyValues devuelve un objeto
    const currencyData = await fetchCurrencyValues();
    
    // Verificar que el objeto y las propiedades existan
    if (currencyData && currencyData.Valor_Dolar !== undefined && currencyData.Valor_Euro !== undefined && currencyData.Fecha !== undefined) {
      // Acceder directamente a las propiedades del objeto
      currencyCache.dollar.value = currencyData.Valor_Dolar;
      currencyCache.euro.value = currencyData.Valor_Euro;
      currencyCache.dollar.fecha = currencyData.Fecha;
      currencyCache.euro.fecha = currencyData.Fecha;
      currencyCache.dollar.last_update = new Date().toISOString();
      currencyCache.euro.last_update = new Date().toISOString();
      
      console.log('Internal currency cache updated automatically at:', new Date().toISOString());
    } else {
       console.error('Invalid currency data received during automatic update:', currencyData);
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
    // Siempre escribir/sobrescribir el archivo de caché con el contenido actual de cachedProducts
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cachedProducts, null, 2), 'utf-8');
    console.log('Cache de productos guardado/actualizado en disco.');
  } catch (err) {
    console.error('Error al guardar el cache de productos:', err);
  }
};

// @desc    Fetch products from DB and cache them
// @route   GET /api/products/fetch
// @access  Public
const fetchProducts = async (req, res) => {
  try {
    const products = await fetchBaseProductsFromDB();
    
    cachedProducts = products; // Cache the products
    saveCacheToDisk();
    
    res.status(200).json({ 
      message: 'Products fetched from DB and cached successfully',
      count: products.length,
      products 
    });
  } catch (error) {
    console.error('Error in fetchProducts controller:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch and cache products' });
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
    // fetchCurrencyValues ahora devuelve un objeto directamente
    const currencyData = await fetchCurrencyValues(); 
    
    // Verificar que el objeto y las propiedades existan
    if (currencyData && currencyData.Valor_Dolar !== undefined && currencyData.Valor_Euro !== undefined && currencyData.Fecha !== undefined) {
      // Acceder directamente a las propiedades del objeto
      currencyCache.dollar.value = currencyData.Valor_Dolar;
      currencyCache.euro.value = currencyData.Valor_Euro;
      currencyCache.dollar.fecha = currencyData.Fecha;
      currencyCache.euro.fecha = currencyData.Fecha;
      currencyCache.dollar.last_update = new Date().toISOString();
      currencyCache.euro.last_update = new Date().toISOString();

      res.status(200).json({ 
        message: 'Currency values fetched and cached successfully', 
        currencies: currencyCache 
      });
    } else {
      // Si el objeto o las propiedades faltan
      console.error('Invalid currency data received from fetchCurrencyValues:', currencyData);
      res.status(404).json({ message: 'Invalid or incomplete currency data received' });
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

// @desc    Get all products from cached memory (was getAllProductsAndCache)
// @route   GET /api/products/cache/all
// @access  Public
const getAllProductsAndCache = (req, res) => { // Ya no necesita ser async
  try {
    // Servir directamente desde el caché en memoria
    // El caché en memoria (cachedProducts) se actualiza al inicio y por /api/products/fetch o /reset
    const response = {
      success: true,
      data: {
        currencies: currencyCache, // currencyCache se actualiza por su propio mecanismo
        products: {
          total: cachedProducts.length,
          data: cachedProducts // Usar la variable cachedProducts
        }
      },
      timestamp: new Date().toISOString()
    };
    
    console.log(`Servido /api/products/cache/all con ${cachedProducts.length} productos desde caché en memoria.`);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error en getAllProductsAndCache (sirviendo desde memoria):', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener todos los productos del caché de memoria',
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
    const products = await fetchBaseProductsFromDB();
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
    const productsFromCache = cachedProducts;
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
        const cachedProducts = cachedProducts;
        
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

// @desc    Create a new product
// @route   POST /api/products
// @access  Public (o Private si implementas autenticación)
const createProductController = async (req, res) => {
  try {
    const productData = req.body;

    // --- Validación (existente, la mantenemos) --- 
    const requiredFields = {
      topLevel: [
        'Codigo_Producto', 'categoria', 'peso_kg', 'clasificacion_easysystems',
        'codigo_ea', 'proveedor', 'procedencia'
      ],
      caracteristicas: ['nombre_del_producto', 'modelo'],
      dimensiones: ['largo_cm', 'ancho_cm', 'alto_cm']
    };
    for (const field of requiredFields.topLevel) {
      if (productData[field] === undefined || productData[field] === null || productData[field] === '') {
        return res.status(400).json({ message: `El campo ${field} es requerido`, field });
      }
    }
    if (!productData.caracteristicas) {
      return res.status(400).json({ message: 'El objeto caracteristicas es requerido', field: 'caracteristicas' });
    }
    for (const field of requiredFields.caracteristicas) {
      if (productData.caracteristicas[field] === undefined || productData.caracteristicas[field] === null || productData.caracteristicas[field] === '') {
        return res.status(400).json({ message: `El campo caracteristicas.${field} es requerido`, field: `caracteristicas.${field}` });
      }
    }
    if (!productData.dimensiones) {
      return res.status(400).json({ message: 'El objeto dimensiones es requerido', field: 'dimensiones' });
    }
    for (const field of requiredFields.dimensiones) {
      if (productData.dimensiones[field] === undefined || productData.dimensiones[field] === null || productData.dimensiones[field] === '') {
        return res.status(400).json({ message: `El campo dimensiones.${field} es requerido`, field: `dimensiones.${field}` });
      }
    }
    const numericFields = {
        topLevel: ['peso_kg'],
        dimensiones: ['largo_cm', 'ancho_cm', 'alto_cm']
    };
    for (const field of numericFields.topLevel) {
        if (productData[field] === undefined || isNaN(Number(productData[field]))) {
            return res.status(400).json({ message: `El campo ${field} debe ser un número válido`, field });
        }
    }
    if (productData.dimensiones) { 
        for (const field of numericFields.dimensiones) {
            if (productData.dimensiones[field] === undefined || isNaN(Number(productData.dimensiones[field]))) {
                return res.status(400).json({ message: `El campo dimensiones.${field} debe ser un número válido`, field: `dimensiones.${field}` });
            }
        }
    }
    // --- Fin Validación --- 

    console.log('[INFO] Validation passed for creating product with Codigo_Producto:', productData.Codigo_Producto);
    
    const newProduct = await createProductInDB(productData);

    // Actualizar caché después de crear un nuevo producto
    // Podríamos simplemente añadir el nuevo producto al caché en memoria y al de disco,
    // o recargar todo el caché desde la DB para asegurar consistencia total.
    // Recargar todo es más simple de implementar ahora.
    console.log('Product created, attempting to refresh cache...');
    const productsFromDB = await fetchBaseProductsFromDB(); // Esta función ya transforma los datos
    cachedProducts = productsFromDB;
    saveCacheToDisk();
    console.log('Cache refreshed after product creation.');

    res.status(201).json({
      message: 'Producto creado exitosamente y caché actualizado.',
      data: newProduct // Devolver el producto completo insertado en la DB
    });

  } catch (error) {
    console.error('[ERROR] Error creating product:', error);
    // Si el error es por duplicado, el mensaje de createProductInDB será útil
    if (error.message && error.message.includes('ya existe')) {
        return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    res.status(500).json({ 
      message: 'Error al crear el producto.',
      error: error.message 
    });
  }
};

// --- Función para inicializar el caché de productos al inicio de la aplicación ---
async function initializeProductCache() {
  try {
    console.log('Inicializando caché de productos desde DB al arrancar la aplicación...');
    const productsFromDB = await fetchBaseProductsFromDB();
    cachedProducts = productsFromDB; // Actualizar caché en memoria
    saveCacheToDisk(); // Guardar en archivo (saveCacheToDisk ya sobrescribe)
    console.log(`Caché de productos inicializado con ${cachedProducts.length} productos y guardado en disco.`);
  } catch (error) {
    console.error('Error fatal al inicializar el caché de productos desde DB:', error);
    // Considerar si la aplicación debe continuar si el caché no se puede cargar.
    // Por ahora, la aplicación continuará con un caché vacío si esto falla.
    cachedProducts = []; 
    // No intentar guardar un caché vacío si la carga inicial falló, para no borrar un archivo bueno.
  }
}

// Llamar a la inicialización del caché cuando este módulo se carga por primera vez.
// Esto asegura que se intente poblar el caché tan pronto como el controlador esté listo.
initializeProductCache();

// --- NUEVO: Handler para el endpoint de prueba de DB ---
const testGetBaseProductsFromDBController = async (req, res) => {
  try {
    console.log('[Controller Test] Attempting to fetch base products directly from DB for testing...');
    const products = await fetchBaseProductsFromDB();
    res.status(200).json({
      message: 'Test successful: Fetched base products directly from DB',
      count: products.length,
      products: products
    });
  } catch (error) {
    console.error('[Controller Test] Error fetching base products from DB for testing:', error);
    res.status(500).json({
      message: 'Test failed: Error fetching base products from DB',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// --- NUEVO: Handler para obtener un producto por Codigo_Producto ---
// @desc    Get a single product by its Codigo_Producto
// @route   GET /api/products/code/:codigoProducto
// @access  Public
const getProductByCodeController = async (req, res) => {
  try {
    const { codigoProducto } = req.params;
    if (!codigoProducto) {
      return res.status(400).json({ message: 'El parámetro codigoProducto es requerido.' });
    }

    console.log(`[Controller] Attempting to fetch product by Codigo_Producto: ${codigoProducto}`);
    const product = await getProductByCodeFromDB(codigoProducto);

    if (!product) {
      return res.status(404).json({ message: `Producto con Codigo_Producto ${codigoProducto} no encontrado.` });
    }

    res.status(200).json({
      message: 'Producto encontrado exitosamente.',
      data: product
    });

  } catch (error) {
    console.error(`[Controller] Error fetching product by Codigo_Producto ${req.params.codigoProducto}:`, error);
    res.status(500).json({ 
      message: 'Error al obtener el producto.',
      error: error.message 
    });
  }
};

// --- NUEVO: Handler para actualizar un producto por Codigo_Producto ---
// @desc    Update a product by its Codigo_Producto
// @route   PUT /api/products/code/:codigoProducto
// @access  Public (o Private)
const updateProductController = async (req, res) => {
  try {
    const { codigoProducto } = req.params;
    const updateData = req.body;

    if (!codigoProducto) {
      return res.status(400).json({ message: 'El parámetro codigoProducto es requerido.' });
    }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'El cuerpo de la solicitud (updateData) no puede estar vacío.' });
    }

    // Opcional: Validación más exhaustiva de updateData aquí si es necesario
    // Por ejemplo, verificar que no se intenten pasar campos no permitidos o formatos incorrectos.

    console.log(`[Controller] Attempting to update product with Codigo_Producto: ${codigoProducto}`);
    const updatedProduct = await updateProductInDB(codigoProducto, updateData);

    if (!updatedProduct) {
      return res.status(404).json({ message: `Producto con Codigo_Producto ${codigoProducto} no encontrado para actualizar.` });
    }

    // Actualizar caché después de la modificación
    console.log('Product updated, attempting to refresh cache...');
    const productsFromDB = await fetchBaseProductsFromDB();
    cachedProducts = productsFromDB;
    saveCacheToDisk();
    console.log('Cache refreshed after product update.');

    res.status(200).json({
      message: 'Producto actualizado exitosamente y caché refrescado.',
      data: updatedProduct
    });

  } catch (error) {
    console.error(`[Controller] Error updating product with Codigo_Producto ${req.params.codigoProducto}:`, error);
    res.status(500).json({ 
      message: 'Error al actualizar el producto.',
      error: error.message 
    });
  }
};

// --- NUEVO: Handler para eliminar un producto por Codigo_Producto ---
// @desc    Delete a product by its Codigo_Producto
// @route   DELETE /api/products/code/:codigoProducto
// @access  Public (o Private)
const deleteProductController = async (req, res) => {
  try {
    const { codigoProducto } = req.params;

    if (!codigoProducto) {
      return res.status(400).json({ message: 'El parámetro codigoProducto es requerido.' });
    }

    console.log(`[Controller] Attempting to delete product with Codigo_Producto: ${codigoProducto}`);
    const wasDeleted = await deleteProductFromDB(codigoProducto);

    if (!wasDeleted) {
      return res.status(404).json({ message: `Producto con Codigo_Producto ${codigoProducto} no encontrado para eliminar.` });
    }

    // Actualizar caché después de la eliminación
    console.log('Product deleted, attempting to refresh cache...');
    const productsFromDB = await fetchBaseProductsFromDB();
    cachedProducts = productsFromDB;
    saveCacheToDisk();
    console.log('Cache refreshed after product deletion.');

    res.status(200).json({
      message: `Producto con Codigo_Producto ${codigoProducto} eliminado exitosamente y caché refrescado.`
    });

  } catch (error) {
    console.error(`[Controller] Error deleting product with Codigo_Producto ${req.params.codigoProducto}:`, error);
    res.status(500).json({ 
      message: 'Error al eliminar el producto.',
      error: error.message 
    });
  }
};

// Añadir las funciones de carga de Excel que faltaban
const uploadTechnicalSpecifications = (req, res) => {
  // Implementación de la función uploadTechnicalSpecifications
  res.status(501).json({ message: 'Function not implemented' });
};

const uploadBulkProductsMatrix = (req, res) => {
  // Implementación de la función uploadBulkProductsMatrix
  res.status(501).json({ message: 'Function not implemented' });
};

module.exports = { 
  fetchProducts, 
  getCachedProducts, 
  fetchFilteredProductsController, 
  fetchCurrencyValuesController, 
  getCachedDollarValue, 
  getCachedEuroValue,
  getAllProductsAndCache, 
  resetCache,
  clearCache,
  getProductDetail,
  getOptionalProducts,
  createProductController,
  getProductByCodeController,
  updateProductController,
  deleteProductController,
  testGetBaseProductsFromDBController,
  uploadTechnicalSpecifications,
  uploadBulkProductsMatrix
};