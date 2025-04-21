const express = require('express');
const { getCostos } = require('../controllers/costosController'); // << Descomentar controlador

const router = express.Router();

// Definir la ruta GET /costos/:codigo
// Llama al controlador getCostos para manejar la solicitud
router.get('/costos/:codigo', getCostos); // << Descomentar ruta

module.exports = router; 