const CostoPerfil = require('../models/CostoPerfil');

// @desc    Crear un nuevo perfil de costo
// @route   POST /api/costo-perfiles
// @access  Private (ejemplo, ajustar según necesidad)
const createCostoPerfil = async (req, res) => {
  try {
    const nuevoPerfil = new CostoPerfil(req.body);
    const perfilGuardado = await nuevoPerfil.save();
    res.status(201).json(perfilGuardado);
  } catch (error) {
    console.error('Error al crear perfil de costo:', error);
    res.status(400).json({ message: 'Error al crear el perfil', error: error.message });
  }
};

// @desc    Obtener todos los perfiles de costo
// @route   GET /api/costo-perfiles
// @access  Private (ejemplo)
const getAllCostoPerfiles = async (req, res) => {
  try {
    // Podríamos añadir filtros o paginación aquí si es necesario
    const perfiles = await CostoPerfil.find({});
    res.status(200).json(perfiles);
  } catch (error) {
    console.error('Error al obtener perfiles de costo:', error);
    res.status(500).json({ message: 'Error al obtener los perfiles' });
  }
};

// @desc    Obtener un perfil de costo por ID
// @route   GET /api/costo-perfiles/:id
// @access  Private (ejemplo)
const getCostoPerfilById = async (req, res) => {
  try {
    const perfil = await CostoPerfil.findById(req.params.id);
    if (!perfil) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    res.status(200).json(perfil);
  } catch (error) {
    console.error('Error al obtener perfil por ID:', error);
    // Si el ID tiene un formato inválido, Mongoose puede lanzar un error
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'ID de perfil inválido' });
    }
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
};

// @desc    Actualizar un perfil de costo por ID
// @route   PUT /api/costo-perfiles/:id
// @access  Private (ejemplo)
const updateCostoPerfil = async (req, res) => {
  try {
    const perfil = await CostoPerfil.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Devuelve el doc actualizado y corre validaciones
    );
    if (!perfil) {
      return res.status(404).json({ message: 'Perfil no encontrado para actualizar' });
    }
    res.status(200).json(perfil);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'ID de perfil inválido' });
    }
    res.status(400).json({ message: 'Error al actualizar el perfil', error: error.message });
  }
};

// @desc    Eliminar un perfil de costo por ID
// @route   DELETE /api/costo-perfiles/:id
// @access  Private (ejemplo)
const deleteCostoPerfil = async (req, res) => {
  try {
    const perfil = await CostoPerfil.findByIdAndDelete(req.params.id);
    if (!perfil) {
      return res.status(404).json({ message: 'Perfil no encontrado para eliminar' });
    }
    // Importante: Considerar qué sucede con los productos/equipos que usaban este perfil.
    // Podría ser necesario reasignar un perfil por defecto o marcar esos productos.
    // La lógica de cálculo referenciada en la imagen se aplicaría en los endpoints que usan estos perfiles,
    // no directamente aquí en el CRUD del perfil mismo.
    res.status(200).json({ message: 'Perfil eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar perfil:', error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'ID de perfil inválido' });
    }
    res.status(500).json({ message: 'Error al eliminar el perfil' });
  }
};

module.exports = {
  createCostoPerfil,
  getAllCostoPerfiles,
  getCostoPerfilById,
  updateCostoPerfil,
  deleteCostoPerfil
}; 