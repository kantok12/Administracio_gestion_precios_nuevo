const express = require('express');
const router = express.Router();
const { 
  fetchProducts, 
  getCachedProducts, 
  fetchFilteredProductsController, 
  fetchCurrencyValuesController, 
  getCachedDollarValue, 
  getCachedEuroValue,
  getAllCachedValues,
  clearCache,
  getProductDetail,
  getOptionalProducts,
  resetCache
} = require('../controllers/productController');

// Rutas principales de productos
router.get('/fetch', fetchProducts);                    // Obtener productos frescos del webhook
router.get('/', getCachedProducts);                     // Obtener productos del caché
router.get('/cache/all', getAllCachedValues);          // Obtener todos los valores en caché (productos y divisas)
router.get('/detail', getProductDetail);               // Obtener detalles de un producto específico
router.get('/opcionales', getOptionalProducts);        // Obtener productos opcionales

// Rutas de gestión de caché
router.post('/cache/reset', resetCache);               // Resetear todo el caché
router.delete('/cache', clearCache);                   // Limpiar todo el caché

// Rutas de divisas
router.get('/currency/fetch', fetchCurrencyValuesController);  // Obtener valores de divisas frescos
router.get('/currency/dollar', getCachedDollarValue);         // Obtener valor del dólar en caché
router.get('/currency/euro', getCachedEuroValue);            // Obtener valor del euro en caché

module.exports = router;