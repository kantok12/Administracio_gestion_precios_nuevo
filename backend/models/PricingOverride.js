const mongoose = require('mongoose');

const pricingOverrideSchema = new mongoose.Schema({
  _id: {
    type: String, // El _id será 'global', 'cat_...', 'prod_...'
    required: true,
  },
  nivel: {
    type: String,
    required: true,
    enum: ['global', 'categoria', 'producto'],
    index: true
  },
  costos: {
    type: mongoose.Schema.Types.Mixed, // Permite cualquier estructura de objeto
    // Considera definir un sub-esquema si la estructura es fija:
    // type: {
    //   margen_adicional_total: Number,
    //   buffer_usd_clp: Number,
    //   // ... otros campos de costos
    // },
    default: {} // Valor por defecto si no se proporciona
  },
  metadata: {
    type: {
      ultima_actualizacion: { type: Date, default: Date.now },
      actualizado_por: { type: String } // O podrías referenciar a un User ID
    },
    default: () => ({ ultima_actualizacion: new Date() })
  },
  // Campos opcionales para referencia (útiles para queries, aunque no estrictamente necesarios para _id)
  categoryId: {
    type: String,
    index: true,
    sparse: true // Índice solo si el campo existe (para nivel: categoria)
  },
  productId: {
    type: String,
    index: true,
    sparse: true // Índice solo si el campo existe (para nivel: producto)
  }
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  collection: 'pricingOverrides', // Especificar el nombre exacto de la colección
  _id: false // Añadir esta configuración para deshabilitar la conversión automática a ObjectId
});

// Index sugerido para búsquedas específicas si se necesitaran
// pricingOverrideSchema.index({ productId: 1 }); 
// pricingOverrideSchema.index({ categoryId: 1 });

// Función para inicializar documentos por defecto
pricingOverrideSchema.statics.initializeDefaults = async function() {
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
    // Verificar si ya existe el documento global
    const existingGlobal = await this.findOne({ _id: 'global' });
    if (!existingGlobal) {
      console.log('[PricingOverride] Creating default global override document...');
      await this.create(defaultGlobal);
      console.log('[PricingOverride] Default global override document created successfully');
    } else {
      console.log('[PricingOverride] Global override document already exists');
    }
    return true;
  } catch (error) {
    console.error('[PricingOverride] Error initializing default documents:', error);
    return false;
  }
};

// Crear el modelo o reutilizarlo si ya existe
const PricingOverride = mongoose.models.PricingOverride || mongoose.model('PricingOverride', pricingOverrideSchema);

// Exportar el modelo
module.exports = PricingOverride; 