const express = require('express');
const router = express.Router();
const { 
  getCategoryOverride, 
  upsertCategoryOverride, 
  initializeCategoryOverride,
  initializeChipeadoraOverride,
  initializeChipeadoraMotorOverride,
  initializeChipeadoraPTOOverride,
  initializeAllChipeadoraCategories
} = require('../controllers/categoryOverridesController');

// GET /api/category-overrides/:categoryId - Obtener parámetros específicos de una categoría
router.get('/:categoryId', getCategoryOverride);

// PUT /api/category-overrides/:categoryId - Actualizar parámetros de una categoría
router.put('/:categoryId', upsertCategoryOverride);

// POST /api/category-overrides/initialize - Inicializar un nuevo documento de categoría basado en global
router.post('/initialize', initializeCategoryOverride);

// POST /api/category-overrides/initialize-chipeadora - Inicializar específicamente "categoria_chipeadora"
router.post('/initialize-chipeadora', initializeChipeadoraOverride);

// POST /api/category-overrides/initialize-chipeadora-motor - Inicializar específicamente "chipeadora_motor"
router.post('/initialize-chipeadora-motor', initializeChipeadoraMotorOverride);

// POST /api/category-overrides/initialize-chipeadora-pto - Inicializar específicamente "chipeadora_pto"
router.post('/initialize-chipeadora-pto', initializeChipeadoraPTOOverride);

// POST /api/category-overrides/initialize-all-chipeadoras - Inicializar todas las categorías de chipeadoras
router.post('/initialize-all-chipeadoras', initializeAllChipeadoraCategories);

module.exports = router; 