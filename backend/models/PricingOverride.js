const mongoose = require('mongoose');

console.log('[Database] Initializing PricingOverride model...');

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
    type: mongoose.Schema.Types.Mixed,
    default: {},
    required: [true, 'Los costos son requeridos'],
    validate: {
      validator: function(v) {
        return typeof v === 'object' && v !== null;
      },
      message: 'Los costos deben ser un objeto válido'
    }
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
  next();
});

pricingOverrideSchema.post('save', function(doc) {
  console.log(`[PricingOverride] Documento ${doc._id} guardado exitosamente`);
});

// Función para inicializar documentos por defecto
pricingOverrideSchema.statics.initializeDefaults = async function() {
  console.log('[PricingOverride] Iniciando inicialización de documentos por defecto...');
  
  const defaultGlobal = {
    _id: "global",
    nivel: "global",
    costos: {
      tipo_cambio_eur_usd: 1.1,
      buffer_eur_usd: 0.02,
      dolar_observado_actual: 975,
      buffer_dolar: 0.03,
      tasa_seguro: 0.006,
      margen_adicional_total: 0.35,
      costo_fabrica_original_eur: 100000,
      descuento_fabricante: 0.1,
      buffer_transporte: 0.05,
      fecha_ultima_actualizacion_transporte_local: "2025-04-21",
      transporte_local_eur: 800,
      gasto_importacion_eur: 400,
      flete_maritimo_usd: 3500,
      recargos_destino_usd: 500,
      honorarios_agente_aduana_usd: 600,
      gastos_portuarios_otros_usd: 200,
      transporte_nacional_clp: 950000,
      factor_actualizacion_anual: 0.05,
      derecho_ad_valorem: 0.06,
      iva: 0.19
    },
    metadata: {
      ultima_actualizacion: new Date("2025-04-21T00:00:00Z"),
      actualizado_por: "admin"
    }
  };
  
  try {
    console.log('[PricingOverride] Verificando existencia del documento global...');
    const existingGlobal = await this.findOne({ _id: 'global' });
    
    if (!existingGlobal) {
      console.log('[PricingOverride] Documento global no encontrado. Creando...');
      await this.create(defaultGlobal);
      console.log('[PricingOverride] ✅ Documento global creado exitosamente');
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

// Método para validar estructura de costos
pricingOverrideSchema.methods.validateCostos = function() {
  const requiredFields = [
    'tipo_cambio_eur_usd',
    'buffer_eur_usd',
    'dolar_observado_actual',
    'tasa_seguro',
    'margen_adicional_total'
  ];
  
  const missingFields = requiredFields.filter(field => !(field in this.costos));
  
  if (missingFields.length > 0) {
    throw new Error(`Campos requeridos faltantes en costos: ${missingFields.join(', ')}`);
  }
  
  return true;
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