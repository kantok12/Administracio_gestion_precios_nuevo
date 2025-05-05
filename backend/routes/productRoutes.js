const express = require('express');
const router = express.Router();

// --- Importar controladores ---
// Controlador para operaciones con Mongoose (crear, cargar excel)
const productoCtrl = require('../controllers/productoController.js'); // Con 'o'
// Controlador para operaciones con caché y llamadas a webhook (sin 'o')
const productCtrl = require('../controllers/productController.js');

const path = require('path');
const fs = require('fs');

// --- Rutas que usan productController (sin 'o' - caché/webhook) ---
router.get('/fetch', productCtrl.fetchProducts);
router.get('/', productCtrl.getCachedProducts); // Asumiendo que esto debe mostrar caché
router.get('/filter', productCtrl.fetchFilteredProductsController);
router.get('/cache/all', productCtrl.getAllCachedValues);
router.post('/cache/reset', productCtrl.resetCache);
router.delete('/cache', productCtrl.clearCache); // Corregido DELETE
router.get('/detail', productCtrl.getProductDetail);
router.get('/opcionales', productCtrl.getOptionalProducts);

// Ruta para descargar plantilla (lógica local)
router.get('/download-template', (req, res) => {
  const templatePath = path.join(__dirname, '../Plantilla_Carga_Equipos.xlsx');
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

// --- Rutas que usan productoController (con 'o' - Mongoose) ---
// Crear equipo individual (AHORA USA la versión con Mongoose)
router.post('/equipment', productoCtrl.createIndividualEquipment);
// Cargar productos desde Excel
router.post('/cargar-excel', productoCtrl.cargarProductosDesdeExcel);

module.exports = router;