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
  clearCache 
} = require('../controllers/productController');

// Route to fetch products from webhook
router.get('/fetch', fetchProducts);

// Route to fetch filtered products
router.get('/filter', fetchFilteredProductsController);

// Route to get cached products
router.get('/', getCachedProducts);

// Route to fetch currency values and cache them
router.get('/currency/fetch', fetchCurrencyValuesController);

// Route to get cached dollar value
router.get('/currency/dollar', getCachedDollarValue);

// Route to get cached euro value
router.get('/currency/euro', getCachedEuroValue);

// Route to get all cached values
router.get('/cache/all', getAllCachedValues);

// Route to clear all cache
router.delete('/cache', clearCache);

module.exports = router;