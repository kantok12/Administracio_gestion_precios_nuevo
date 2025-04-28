const express = require('express');
const router = express.Router();

// Importar el controlador con el nuevo nombre
const {
  getGlobalOverride,
  updateGlobalOverride,
  getCategoryOverride,
  updateCategoryOverride,
  deleteCategoryOverride,
  getAllOverrides // Asegúrate que esta función exista si la necesitas
} = require('../controllers/perfilesController.js'); // <--- Cambio aquí

// Ruta para obtener todos los overrides (si existe)
router.get('/', getAllOverrides);

// Rutas para el override global
router.route('/global')
  .get(getGlobalOverride)
  .put(updateGlobalOverride);

// Rutas para overrides específicos por ID de categoría/perfil
router.route('/:categoryId') // Mantenemos el parámetro como categoryId por ahora
  .get(getCategoryOverride)
  .put(updateCategoryOverride)
  .delete(deleteCategoryOverride);

module.exports = router; 