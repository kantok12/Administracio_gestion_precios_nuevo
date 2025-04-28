const express = require('express');
const router = express.Router();
const {
    createPerfil,
    getPerfiles,
    getPerfilById,
    updatePerfil,
    deletePerfil
} = require('../controllers/perfilController');

// Import middleware for protected routes if needed
// const { protect } = require('../middleware/authMiddleware');

// Define CRUD routes
// Add 'protect' middleware to routes that require authentication

router.post('/', createPerfil);        // POST /api/perfiles
router.get('/', getPerfiles);         // GET /api/perfiles
router.get('/:id', getPerfilById);    // GET /api/perfiles/:id
router.put('/:id', updatePerfil);     // PUT /api/perfiles/:id
router.delete('/:id', deletePerfil); // DELETE /api/perfiles/:id

module.exports = router; 