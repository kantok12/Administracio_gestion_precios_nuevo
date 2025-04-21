const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  Codigo_Producto: {
    type: String,
    required: true,
    unique: true, // Asumiendo que el código es único
    index: true // Indexar para búsquedas rápidas
  },
  categoria: {
    type: String,
    required: true,
    index: true // Indexar si se busca frecuentemente por categoría
  },
  // Añadir otros campos relevantes del producto si los necesitas
  // nombre: String,
  // descripcion: String,
  // etc...
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  collection: 'Productos' // Especificar el nombre exacto de la colección
});

// Crear el modelo o reutilizarlo si ya existe
const Producto = mongoose.models.Producto || mongoose.model('Producto', productoSchema);

module.exports = Producto; 