const mongoose = require('mongoose');

console.log('[Database] Initializing PricingOverride model...');

// --- NUEVO: Sub-Esquema para los campos de costos ---
const costosSchema = new mongoose.Schema({
  tipo_cambio_eur_usd: { type: Number, default: 1.1 },
  buffer_eur_usd: { type: Number, default: 0.02, min: 0, max: 1 }, // Porcentaje 0-1
  dolar_observado_actual: { type: Number, default: 975 },
  buffer_usd_clp: { type: Number, default: 0.018, min: 0, max: 1 }, // Porcentaje 0-1
  tasa_seguro: { type: Number, default: 0.006, min: 0, max: 1 }, // 0.6%
  margen_adicional_total: { type: Number, default: 0.35, min: 0 }, // Margen
  costo_fabrica_original_eur: { type: Number, default: 100000, min: 0 },
  descuento_fabricante: { type: Number, default: 0.10, min: 0, max: 1 }, // 10%
  factor_actualizacion_anual: { type: Number, default: 0.05, min: 0 }, // 5%
  transporte_local_eur: { type: Number, default: 800, min: 0 },
  gasto_importacion_eur: { type: Number, default: 400, min: 0 },
  flete_maritimo_usd: { type: Number, default: 3500, min: 0 },
  recargos_destino_usd: { type: Number, default: 500, min: 0 },
  honorarios_agente_aduana_usd: { type: Number, default: 600, min: 0 },
  gastos_portuarios_otros_usd: { type: Number, default: 200, min: 0 },
  transporte_nacional_clp: { type: Number, default: 950000, min: 0 },
  derecho_ad_valorem: { type: Number, default: 0.06, min: 0, max: 1 }, // 6%
  iva: { type: Number, default: 0.19, min: 0, max: 1 }, // 19%
  // Campos adicionales mencionados (añadir si son necesarios y definir su tipo)
  buffer_transporte: { type: Number, default: 0 }, // Ejemplo: añadido como número, default 0
  fecha_ultima_actualizacion_transporte_local: { type: Date, default: null } // Ejemplo: añadido como fecha
}, { _id: false }); // No crear _id para el subdocumento

// --- Esquema Principal (Modificado) ---
const pricingOverrideSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: [true, 'El ID es requerido'],
    validate: {
      validator: function(v) {
        return v === 'global' || v.startsWith('cat_') || v.startsWith('prod_');
      },
      message: props => `${props.value} no es un ID válido. Debe ser 'global', empezar con 'cat_' o 'prod_'`
    }
  },
  nivel: {
    type: String,
    required: [true, 'El nivel es requerido'],
    enum: {
      values: ['global', 'categoria', 'producto'],
      message: '{VALUE} no es un nivel válido'
    },
    index: true
  },
  costos: {
    type: costosSchema,
    default: () => ({}),
    required: [true, 'El objeto costos es requerido']
  },
  metadata: {
    type: {
      ultima_actualizacion: { 
        type: Date, 
        default: Date.now,
        required: [true, 'La fecha de última actualización es requerida']
      },
      actualizado_por: { 
        type: String,
        required: [true, 'El usuario que actualiza es requerido'],
        default: 'system'
      }
    },
    default: () => ({ 
      ultima_actualizacion: new Date(),
      actualizado_por: 'system'
    })
  },
  categoryId: {
    type: String,
    index: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (this.nivel !== 'categoria') return true;
        return v && v.length > 0;
      },
      message: 'categoryId es requerido para documentos de nivel categoria'
    }
  },
  productId: {
    type: String,
    index: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (this.nivel !== 'producto') return true;
        return v && v.length > 0;
      },
      message: 'productId es requerido para documentos de nivel producto'
    }
  }
}, {
  timestamps: true,
  collection: 'pricingOverrides',
  _id: false
});

// Middleware para logging
pricingOverrideSchema.pre('save', function(next) {
  console.log(`[PricingOverride] Guardando documento ${this._id}...`);
  if (this.isNew && typeof this.costos === 'object' && Object.keys(this.costos).length === 0) {
       this.costos = {};
  }
  if (!this.metadata) {
      this.metadata = { ultima_actualizacion: new Date(), actualizado_por: 'system_presave' };
  } else {
      if (!this.metadata.ultima_actualizacion) this.metadata.ultima_actualizacion = new Date();
      if (!this.metadata.actualizado_por) this.metadata.actualizado_por = 'system_presave';
  }
  this.metadata.ultima_actualizacion = new Date();
  
  next();
});

pricingOverrideSchema.post('save', function(doc, next) {
  console.log(`[PricingOverride] Documento ${doc._id} guardado exitosamente`);
  next();
});

// Función para inicializar documentos por defecto
pricingOverrideSchema.statics.initializeDefaults = async function() {
  console.log('[PricingOverride] Iniciando inicialización de documentos por defecto...');
  
  const defaultGlobalData = {
    _id: "global",
    nivel: "global",
    metadata: {
      actualizado_por: "system_init"
    }
  };
  
  try {
    console.log('[PricingOverride] Verificando existencia del documento global...');
    const existingGlobal = await this.findOne({ _id: 'global' });
    
    if (!existingGlobal) {
      console.log('[PricingOverride] Documento global no encontrado. Creando con defaults del esquema...');
      await this.create(defaultGlobalData);
      console.log('[PricingOverride] ✅ Documento global creado exitosamente con defaults');
    } else {
      console.log('[PricingOverride] ℹ️ Documento global ya existe');
      console.log('[PricingOverride] Última actualización:', existingGlobal.metadata.ultima_actualizacion);
    }
    
    console.log('[PricingOverride] Inicialización completada exitosamente');
    return true;
  } catch (error) {
    console.error('[PricingOverride] ❌ Error durante la inicialización:', error);
    console.error('[PricingOverride] Detalles:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return false;
  }
};

// Eliminar el modelo si ya existe
if (mongoose.models.PricingOverride) {
  delete mongoose.models.PricingOverride;
  console.log('[Database] Modelo PricingOverride existente eliminado');
}

// Crear y exportar el modelo
const model = mongoose.model('PricingOverride', pricingOverrideSchema);
console.log('[Database] ✅ Modelo PricingOverride creado exitosamente');

module.exports = model; 