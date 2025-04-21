const express = require('express');
const { 
  getPricingOverridesFromWebhook,
  saveGlobalPricingOverrides
} = require('../controllers/pricingOverridesController');

const router = express.Router();

// GET /api/pricing-overrides/webhook
// Endpoint para obtener los datos de "pricing overrides" desde el webhook externo
router.get('/webhook', getPricingOverridesFromWebhook);

// PUT /api/pricing-overrides/update-global
// Endpoint para recibir parámetros globales del frontend y enviarlos a N8N para guardar
router.put('/update-global', saveGlobalPricingOverrides);

// Podrías añadir más rutas aquí en el futuro, como:
// router.get('/', ...) // Para obtener overrides guardados internamente (si se reintroduce DB)
// router.put('/:id', ...) // Para actualizar un override específico

module.exports = router; 