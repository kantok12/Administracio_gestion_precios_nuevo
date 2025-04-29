const mongoose = require('mongoose');

const costoPerfilSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del perfil es obligatorio.'],
    unique: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  },

  // --- Logistica y seguro --- 
  costo_logistica_origen_eur: {
    type: Number,
    required: true,
    default: 0
  },
  flete_maritimo_usd: {
    type: Number,
    required: true,
    default: 0
  },
  recargos_destino_usd: {
    type: Number,
    required: true,
    default: 0
  },
  prima_seguro_usd: {
    type: Number,
    required: true,
    default: 0
  },
  tasa_seguro_pct: {
    type: Number,
    required: true,
    default: 0
  },
  transporte_nacional_clp: {
    type: Number,
    required: true,
    default: 0
  },

  // --- Costos de Importación ---
  costo_agente_aduana_usd: {
    type: Number,
    required: true,
    default: 0
  },
  gastos_portuarios_otros_usd: {
    type: Number,
    required: true,
    default: 0
  },
  derecho_advalorem_pct: {
    type: Number,
    required: true,
    default: 0.06
  },

  // --- Conversón a CLP y Margen ---
  margen_adicional_pct: {
    type: Number,
    required: true,
    default: 0
  },
  buffer_usd_clp_pct: {
    type: Number,
    required: true,
    default: 0
  },
  buffer_eur_usd_pct: {
    type: Number,
    required: true,
    default: 0
  },
  iva_pct: {
    type: Number,
    required: true,
    default: 0.19
  },

  // --- Precios para Cliente ---
  descuento_fabrica_pct: {
    type: Number,
    required: true,
    default: 0
  },
  descuento_cliente_pct: {
    type: Number,
    required: true,
    default: 0
  }

}, {
  timestamps: true
});

// Índices para consultas comunes (opcional pero recomendado para rendimiento)
costoPerfilSchema.index({ nombre: 1 });
costoPerfilSchema.index({ activo: 1 });


const CostoPerfil = mongoose.model('CostoPerfil', costoPerfilSchema);

module.exports = CostoPerfil; 