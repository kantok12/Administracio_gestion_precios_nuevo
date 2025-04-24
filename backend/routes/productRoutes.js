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
  resetCache,
  getPricingOverrides,
  createIndividualEquipment
} = require('../controllers/productController');
const path = require('path');
const fs = require('fs');

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

// Endpoint para obtener todos los datos de la colección pricingOverrides
router.get('/pricingOverrides', getPricingOverrides);

// Route to download the equipment template
router.get('/download-template', (req, res) => {
  const templatePath = path.join(__dirname, '../Plantilla_Carga_Equipos.xlsx');
  
  // Check if file exists
  if (fs.existsSync(templatePath)) {
    res.download(templatePath, 'Plantilla_Carga_Equipos.xlsx', (err) => {
      if (err) {
        console.error('Error downloading template:', err);
        res.status(500).json({ message: 'Error downloading template' });
      }
    });
  } else {
    res.status(404).json({ message: 'Template file not found' });
  }
});

// Route to create individual equipment
router.post('/equipment', createIndividualEquipment);

module.exports = router;