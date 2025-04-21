// backend/routes/currencyRoutes.js
const express = require('express');
const router = express.Router();

// Importar controladores de productController.js
const {
  fetchCurrencyValuesController, 
  getCachedDollarValue, 
  getCachedEuroValue 
} = require('../controllers/productController');

// GET /api/currency/dollar
router.get('/dollar', getCachedDollarValue);

// GET /api/currency/euro
router.get('/euro', getCachedEuroValue);

// GET /api/currency/fetch
router.get('/fetch', fetchCurrencyValuesController);

// GET /api/currency/ (Ruta base)
router.get('/', (req, res) => {
  res.json({ message: "Currency routes working." });
});

module.exports = router; 