// const Perfil = require('../models/Perfil');
const PricingOverride = require('../models/PricingOverride');
const asyncHandler = require('express-async-handler');
const CostoPerfil = require('../models/CostoPerfil');
const mongoose = require('mongoose');

// @desc    Create a new perfil
// @route   POST /api/perfiles
// @access  Private (Implement access control as needed)
const createPerfil = asyncHandler(async (req, res) => {
    console.warn('[perfilController] POST /api/perfiles - No implementado');
    res.status(501).json({ message: 'Creación de perfil no implementada' });
});

// @desc    Get all perfiles
// @route   GET /api/perfiles
// @access  Public (or Private)
const getPerfiles = async (req, res) => {
  try {
    console.log('[PerfilCtrl] Fetching all CostoPerfil documents...');
    const perfiles = await CostoPerfil.find({}); // Usar CostoPerfil
    console.log(`[PerfilCtrl] Found ${perfiles.length} profiles.`);
    res.status(200).json(perfiles);
  } catch (error) {
    console.error('[PerfilCtrl] Error fetching profiles:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener perfiles' });
  }
};

// @desc    Get a single perfil by ID
// @route   GET /api/perfiles/:id
// @access  Public (or Private)
const getPerfilById = async (req, res) => {
  const profileId = req.params.id;
  console.log(`[PerfilCtrl] Fetching profile with ID: ${profileId}`);
  try {
    const perfil = await CostoPerfil.findById(profileId); // Usar CostoPerfil
    if (!perfil) {
      console.log(`[PerfilCtrl] Profile not found for ID: ${profileId}`);
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    console.log(`[PerfilCtrl] Profile found: ${perfil.nombre}`);
    res.status(200).json(perfil);
  } catch (error) {
    console.error(`[PerfilCtrl] Error fetching profile by ID ${profileId}:`, error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'ID de perfil inválido' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// @desc    Update an existing perfil by ID
// @route   PUT /api/perfiles/:id
// @access  Private
const updatePerfil = async (req, res) => {
  const profileId = req.params.id;
  console.log(`[PerfilCtrl] Attempting to update profile ID: ${profileId}`);
  try {
    // Validar que el ID es válido antes de intentar actualizar
    if (!mongoose.Types.ObjectId.isValid(profileId)) {
       return res.status(400).json({ message: 'ID de perfil inválido' });
    }
    
    // Buscar primero para asegurar que existe
    let perfil = await CostoPerfil.findById(profileId); // Usar CostoPerfil
    if (!perfil) {
      console.log(`[PerfilCtrl] Update failed: Profile not found for ID: ${profileId}`);
      return res.status(404).json({ message: 'Perfil no encontrado para actualizar' });
    }

    // Actualizar el perfil
    // Add all the fields from your CostoPerfil schema here that can be updated
    // Example: perfil.nombre = req.body.nombre || perfil.nombre; ...etc
    // O usar findByIdAndUpdate como antes si prefieres
    const updatedPerfil = await CostoPerfil.findByIdAndUpdate(profileId, req.body, { // Usar CostoPerfil
      new: true, // Devuelve el documento modificado
      runValidators: true // Asegura que las actualizaciones cumplan el esquema
    });

    console.log(`[PerfilCtrl] Profile updated successfully: ${updatedPerfil.nombre}`);
    res.status(200).json(updatedPerfil);

  } catch (error) {
    console.error(`[PerfilCtrl] Error updating profile ID ${profileId}:`, error);
     // Manejar error de validación de Mongoose
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors });
    } 
    // Manejar error de ID duplicado si aplica (ej. si actualizas 'nombre' a uno existente)
    if (error.code === 11000) { 
        return res.status(400).json({ message: 'Error: El nombre del perfil ya existe.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al actualizar el perfil' });
  }
};

// @desc    Delete a perfil by ID
// @route   DELETE /api/perfiles/:id
// @access  Private (Añade middleware de autenticación si es necesario)
const deletePerfil = async (req, res) => {
  const profileId = req.params.id;
  console.log(`[PerfilCtrl] Attempting to delete profile ID: ${profileId}`);
  try {
    // Validar ID
     if (!mongoose.Types.ObjectId.isValid(profileId)) {
       return res.status(400).json({ message: 'ID de perfil inválido' });
    }

    const perfil = await CostoPerfil.findByIdAndDelete(profileId); // Usar CostoPerfil

    if (!perfil) {
      console.log(`[PerfilCtrl] Delete failed: Profile not found for ID: ${profileId}`);
      return res.status(404).json({ message: 'Perfil no encontrado para eliminar' });
    }

    console.log(`[PerfilCtrl] Profile deleted successfully: ${perfil.nombre}`);
    // Aquí podrías añadir lógica para reasignar productos que usaban este perfil si es necesario
    res.status(200).json({ message: 'Perfil eliminado correctamente' });

  } catch (error) {
    console.error(`[PerfilCtrl] Error deleting profile ID ${profileId}:`, error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar el perfil' });
  }
};

// Placeholders para rutas /global si se mantienen (aunque comentadas en rutas)
const getGlobalOverride = asyncHandler(async (req, res) => {
    console.warn('[perfilController] GET /api/perfiles/global - No implementado');
    res.status(501).json({ message: 'Ruta Global GET no implementada, usar /api/perfiles/:id' });
});
const updateGlobalOverride = asyncHandler(async (req, res) => {
    console.warn('[perfilController] PUT /api/perfiles/global - No implementado');
    res.status(501).json({ message: 'Ruta Global PUT no implementada, usar /api/perfiles/:id' });
});

module.exports = {
    createPerfil,
    getPerfiles,
    getPerfilById,
    updatePerfil,
    deletePerfil,
    getGlobalOverride,
    updateGlobalOverride
}; 