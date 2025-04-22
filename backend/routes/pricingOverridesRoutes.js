const express = require('express');
const { 
  getPricingOverridesFromWebhook,
  saveGlobalPricingOverrides,
  updateCurrencyValues
} = require('../controllers/pricingOverridesController');

// Importar el nuevo controlador
const { calculatePricing } = require('../controllers/pricingController');

const router = express.Router();

// GET /api/pricing-overrides/webhook
// Endpoint para obtener los datos de "pricing overrides" desde el webhook externo
router.get('/webhook', getPricingOverridesFromWebhook);

// PUT /api/pricing-overrides/update-global
// Endpoint para recibir parámetros globales del frontend y enviarlos a N8N para guardar
router.put('/update-global', saveGlobalPricingOverrides);

// PUT /api/pricing-overrides/update-currencies
router.put('/update-currencies', updateCurrencyValues);

// --- NUEVA RUTA PARA CÁLCULO DETALLADO ---
// POST /api/pricing-overrides/calculate (o prefijo /api/pricing/ si se monta así en server.js)
router.post('/calculate', calculatePricing);

// Podrías añadir más rutas aquí en el futuro, como:
// router.get('/', ...) // Para obtener overrides guardados internamente (si se reintroduce DB)
// router.put('/:id', ...) // Para actualizar un override específico

module.exports = router; 