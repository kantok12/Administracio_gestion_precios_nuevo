const express = require('express');
const router = express.Router();
const {
  getGlobalOverride,      // Mantener si aún necesitas config global separada
  updateGlobalOverride,   // Mantener si aún necesitas config global separada
  getPerfilById,          // <--- Cambiar nombre aquí (singular)
  updatePerfil,           // <--- Cambiar nombre aquí (singular)
  deletePerfil,           // <--- Cambiar nombre aquí (singular)
  getPerfiles,           // <--- Cambiar nombre aquí para que coincida con el controlador
  createProfile           // NUEVO (opcional) para crear nuevos perfiles
} = require('../controllers/perfilController.js');

// --- Rutas para Perfiles --- 

// GET /api/perfiles - Obtener todos los perfiles
router.get('/', getPerfiles);

// POST /api/perfiles - Crear un nuevo perfil (opcional)
// router.post('/', createProfile); 

// Rutas para un perfil específico por ID
router.route('/:id')
  .get(getPerfilById)       // <--- Usar nombre corregido
  .put(updatePerfil)        // <--- Usar nombre corregido
  .delete(deletePerfil);     // <--- Usar nombre corregido

// --- Rutas para Configuración Global (si aún se usan por separado) ---
/* Si la configuración global ahora es solo otro perfil, estas rutas podrían eliminarse 
   o getGlobalOverride podría simplemente llamar a getPerfilById con un ID específico.
router.route('/global') // ¿O tal vez un ID fijo como 'global_settings'?
  .get(getGlobalOverride)
  .put(updateGlobalOverride);
*/

module.exports = router; 