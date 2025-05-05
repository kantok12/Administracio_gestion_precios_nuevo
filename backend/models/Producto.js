const mongoose = require('mongoose');

// Esquema de Características (Subdocumento)
const caracteristicasSchema = new mongoose.Schema({
    nombre_del_producto: { type: String, /* required: [true, 'El nombre del producto es obligatorio.'], */ trim: true },
    modelo: { type: String, required: [true, 'El modelo es obligatorio.'], trim: true },
    // Añade otros campos si existen dentro de caracteristicas
}, { _id: false });

// Esquema de Dimensiones (Subdocumento)
const dimensionesSchema = new mongoose.Schema({
    largo_cm: { type: Number, required: [true, 'El largo es obligatorio.'] },
    ancho_cm: { type: Number, required: [true, 'El ancho es obligatorio.'] },
    alto_cm: { type: Number, required: [true, 'El alto es obligatorio.'] },
    // Añade otros campos si existen dentro de dimensiones
}, { _id: false });

// Esquema Principal del Producto
const productoSchema = new mongoose.Schema({
    Codigo_Producto: {
        type: String, 
        required: [true, 'El Código de Producto es obligatorio.'], 
        unique: true, 
        trim: true 
    },
    categoria: { 
        type: String, 
        required: [true, 'La categoría es obligatoria.'], 
        trim: true 
    },
    peso_kg: { 
        type: Number, 
        required: [true, 'El peso es obligatorio.'] 
    },
    caracteristicas: { 
        type: caracteristicasSchema, 
        required: [true, 'Las características son obligatorias.'] 
    },
    dimensiones: { 
        type: dimensionesSchema, 
        required: [true, 'Las dimensiones son obligatorias.'] 
    },
    especificaciones_tecnicas: { 
        type: mongoose.Schema.Types.Mixed // Objeto dinámico
    },
    metadata: { 
        type: mongoose.Schema.Types.Mixed // Objeto dinámico
    },
    // Otros campos de nivel superior opcionales
    tipo: { type: String, trim: true },
    familia: { type: String, trim: true },
    proveedor: { type: String, trim: true },
    procedencia: { type: String, trim: true },
    nombre_comercial: { type: String, trim: true },
    descripcion: { type: String, trim: true },
    clasificacion_easysystems: { type: String, trim: true },
    codigo_ea: { type: String, trim: true },
    // <<<--- NUEVOS CAMPOS DE COSTO --->>>
    costo_fabrica_original_eur: { type: Number },
    costo_ano_cotizacion: { type: Number },
    // <<<------------------------------>>>
     // Campos JSON embebidos originales (mantener por compatibilidad con carga masiva si aún se usan)
    dimensiones_json: { type: mongoose.Schema.Types.Mixed },
    especificaciones_tecnicas_json: { type: mongoose.Schema.Types.Mixed },
    opciones_json: { type: mongoose.Schema.Types.Mixed },
    metadata_json: { type: mongoose.Schema.Types.Mixed },

}, { 
    strict: false, // Permite campos no definidos en el schema 
    timestamps: true, // Añade createdAt y updatedAt automáticamente
    versionKey: false, // No añadir __v
    collection: 'Productos' // Especificar nombre con P mayúscula
});

// Índice para búsquedas comunes
productoSchema.index({ Codigo_Producto: 1 });
productoSchema.index({ "caracteristicas.nombre_del_producto": 1 });
productoSchema.index({ categoria: 1 });

// Crear y exportar el modelo. Mongoose se encargará de no recompilarlo.
const Producto = mongoose.model('Producto', productoSchema, 'Productos');

module.exports = Producto; 