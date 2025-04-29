const mongoose = require('mongoose');

const costoPerfilSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del perfil es obligatorio.'],
    unique: true, // Asegura que no haya perfiles con el mismo nombre
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  activo: { // Para poder habilitar/deshabilitar perfiles
    type: Boolean,
    default: true
  },

  // --- PARÁMETROS DEL PERFIL ---

  // Relacionado con Costo Fábrica/Producto (se aplica sobre data del producto)
  descuento_fabrica_pct: { // Ej: 0.10 para 10%
    type: Number,
    required: true,
    default: 0
  },
  factor_actualizacion_anual: { // Ej: 1.05 para incremento anual del 5%
    type: Number,
    required: true,
    default: 1 // Sin actualización por defecto
  },

  // Costos en Origen (Valores fijos o base para el perfil)
  costo_origen_transporte_eur: {
    type: Number,
    required: true,
    default: 0
  },
  costo_origen_gastos_export_eur: {
    type: Number,
    required: true,
    default: 0
  },

  // Flete y Seguro
  flete_maritimo_usd: {
    type: Number,
    required: true,
    default: 0
  },
  recargos_destino_usd: { // THC, etc.
    type: Number,
    required: true,
    default: 0
  },
  tasa_seguro_pct: { // Ej: 0.006 para 0.6%. La lógica aplicará sobre 110% CFR.
    type: Number,
    required: true,
    default: 0
  },

  // Costos de Importación y Aduana
  honorarios_agente_aduana_usd: {
    type: Number,
    required: true,
    default: 0
  },
  gastos_portuarios_otros_usd: {
    type: Number,
    required: true,
    default: 0
  },
  derecho_advalorem_pct: { // Ej: 0.06 para 6%
    type: Number,
    required: true,
    default: 0.06 // Valor común en Chile, por ejemplo
  },

  // Logística Nacional
  transporte_nacional_clp: {
    type: Number,
    required: true,
    default: 0
  },

  // Buffers de Tipo de Cambio (Los tipos de cambio base se obtienen externamente)
  buffer_eur_usd_pct: { // Ej: 0.02 para 2%
    type: Number,
    required: true,
    default: 0
  },
  buffer_usd_clp_pct: { // Ej: 0.03 para 3%
    type: Number,
    required: true,
    default: 0
  },

  // Margen y Precios
  margen_total_pct: { // Ej: 0.35 para 35% sobre Landed Cost
    type: Number,
    required: true,
    default: 0
  },

  // Impuestos (Configurable aunque sea estándar)
  iva_pct: { // Ej: 0.19 para 19%
    type: Number,
    required: true,
    default: 0.19 // IVA estándar Chile
  }

}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Índices para consultas comunes (opcional pero recomendado para rendimiento)
costoPerfilSchema.index({ nombre: 1 });
costoPerfilSchema.index({ activo: 1 });


const CostoPerfil = mongoose.model('CostoPerfil', costoPerfilSchema);

module.exports = CostoPerfil; 