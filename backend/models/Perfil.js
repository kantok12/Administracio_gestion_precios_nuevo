const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const costosSchema = new Schema({
    tipo_cambio_eur_usd: { type: Number, default: 0 },
    buffer_usd_clp: { type: Number, default: 0 },
    buffer_eur_usd: { type: Number, default: 0 },
    tasa_seguro: { type: Number, default: 0 },
    margen_adicional_total: { type: Number, default: 0 },
    buffer_transporte: { type: Number, default: 0 },
    descuento_fabricante: { type: Number, default: 0 },
    costo_fabrica_original_eur: { type: Number, default: 0 },
    transporte_local_eur: { type: Number, default: 0 },
    gasto_importacion_eur: { type: Number, default: 0 },
    flete_maritimo_usd: { type: Number, default: 0 },
    recargos_destino_usd: { type: Number, default: 0 },
    honorarios_agente_aduana_usd: { type: Number, default: 0 },
    gastos_portuarios_otros_usd: { type: Number, default: 0 },
    transporte_nacional_clp: { type: Number, default: 0 },
    factor_actualizacion_anual: { type: Number, default: 0 },
    derecho_ad_valorem: { type: Number, default: 0 },
    iva: { type: Number, default: 0 },
    fecha_ultima_actualizacion_transporte_local: { type: Date },
    dolar_observado_actual: { type: Number, default: 0 }
}, { _id: false });

const metadataSchema = new Schema({
    ultima_actualizacion: { type: Date, default: Date.now },
    actualizado_por: { type: String }
}, { _id: false });

const perfilSchema = new Schema({
    nombre_perfil: {
        type: String,
        required: [true, 'El nombre del perfil es obligatorio.'],
        unique: true,
        trim: true
    },
    nivel: {
        type: String,
        trim: true
    },
    categoria: {
        type: String,
        trim: true
    },
    categoryId: {
        type: String,
        trim: true
    },
    costos: costosSchema,
    metadata: metadataSchema
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Pre-save hook to update metadata
perfilSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.ultima_actualizacion = Date.now();
    // Consider setting actualizado_por based on logged-in user if available
  }
  next();
});

perfilSchema.index({ nombre_perfil: 1 });

// Use the 'pricingOverrides' collection
const Perfil = mongoose.model('Perfil', perfilSchema, 'pricingOverrides');

module.exports = Perfil;