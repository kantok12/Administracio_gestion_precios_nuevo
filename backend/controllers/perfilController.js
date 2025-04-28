const Perfil = require('../models/Perfil');
const PricingOverride = require('../models/PricingOverride');
const asyncHandler = require('express-async-handler');

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
const getPerfiles = asyncHandler(async (req, res) => {
    console.log('[perfilController] GET /api/perfiles - Obteniendo todos los perfiles...');
    const perfiles = await PricingOverride.find({});
    console.log(`[perfilController] GET /api/perfiles - Se encontraron ${perfiles.length} perfiles.`);
    res.status(200).json(perfiles);
});

// @desc    Get a single perfil by ID
// @route   GET /api/perfiles/:id
// @access  Public (or Private)
const getPerfilById = asyncHandler(async (req, res) => {
    const profileId = req.params.id;
    console.log(`[perfilController] GET /api/perfiles/:id - Obteniendo perfil con ID: ${profileId}`);
    try {
        const perfil = await PricingOverride.findOne({ _id: profileId });
        
        if (perfil) {
            console.log(`[perfilController] GET /api/perfiles/:id - Perfil encontrado: ${profileId}`);
            res.status(200).json(perfil);
        } else {
            console.log(`[perfilController] GET /api/perfiles/:id - Perfil ${profileId} no encontrado.`);
            res.status(404);
            throw new Error('Perfil no encontrado');
        }
    } catch (error) {
        console.error(`[perfilController] GET /api/perfiles/:id - Error obteniendo perfil ${profileId}:`, error);
        if (res.statusCode < 400 || res.statusCode === 404 && error.message !== 'Perfil no encontrado') {
            res.status(500); 
        } 
        throw error;
    }
});

// @desc    Update an existing perfil by ID
// @route   PUT /api/perfiles/:id
// @access  Private
const updatePerfil = asyncHandler(async (req, res) => {
    const profileId = req.params.id;
    console.log(`[perfilController] PUT /api/perfiles/:id - Actualizando perfil con ID: ${profileId}`);

    try {
        // Find the profile by ID
        const perfil = await PricingOverride.findById(profileId);

        if (perfil) {
            // Update the profile fields with data from req.body
            // Make sure to list all fields that should be updatable
            // Example: perfil.nombre = req.body.nombre || perfil.nombre; 
            // Add all the fields from your PricingOverride schema here...
            
            // For demonstration, let's assume the entire body contains the profile data
            // In a real scenario, you might want to validate and selectively update fields
            const updatedPerfil = await PricingOverride.findByIdAndUpdate(profileId, req.body, {
                new: true, // Return the updated document
                runValidators: true // Run schema validators on update
            });

            console.log(`[perfilController] PUT /api/perfiles/:id - Perfil ${profileId} actualizado exitosamente.`);
            res.status(200).json(updatedPerfil);
        } else {
            console.log(`[perfilController] PUT /api/perfiles/:id - Perfil ${profileId} no encontrado para actualizar.`);
            res.status(404);
            throw new Error('Perfil no encontrado');
        }
    } catch (error) {
        console.error(`[perfilController] PUT /api/perfiles/:id - Error actualizando perfil ${profileId}:`, error);
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            res.status(400);
            throw new Error('ID de perfil inválido');
        }
        if (error.name === 'ValidationError') {
             res.status(400);
             // Construct a more detailed validation error message if needed
             throw new Error(`Error de validación: ${error.message}`);
        }
        res.status(res.statusCode < 400 ? 500 : res.statusCode); // Keep 4xx status if already set
        throw error;
    }
});

// @desc    Delete a perfil by ID
// @route   DELETE /api/perfiles/:id
// @access  Private (Añade middleware de autenticación si es necesario)
const deletePerfil = asyncHandler(async (req, res) => {
    const profileId = req.params.id;
    console.log(`[perfilController] DELETE /api/perfiles/:id - Intentando eliminar perfil con ID: ${profileId}`);
    
    try {
        // Intentar encontrar y eliminar el documento por su ID
        const perfil = await PricingOverride.findByIdAndDelete(profileId);
        
        if (!perfil) {
            // Si no se encontró el documento con ese ID
            console.log(`[perfilController] DELETE /api/perfiles/:id - Perfil ${profileId} no encontrado.`);
            res.status(404);
            throw new Error('Perfil no encontrado');
        }
        
        // Si se eliminó correctamente
        console.log(`[perfilController] DELETE /api/perfiles/:id - Perfil ${profileId} eliminado exitosamente.`);
        res.status(200).json({ message: 'Perfil eliminado correctamente.' }); // Enviar respuesta OK

    } catch (error) {
        console.error(`[perfilController] DELETE /api/perfiles/:id - Error eliminando perfil ${profileId}:`, error);
        // Manejar error si el ID no es un ObjectId válido
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            res.status(400);
            throw new Error('ID de perfil inválido');
        }
        // Re-lanzar otros errores para que el middleware los maneje
        // Asegúrate de no enviar el status 501 de "No implementado"
        if (!res.headersSent) { // Evitar error si ya se envió un 404 o 400
           res.status(500); 
        }
        throw error; 
    }
});

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