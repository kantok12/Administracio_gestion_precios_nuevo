const mongoose = require('mongoose');

// Crear un nuevo esquema explícitamente para _id de tipo String
const pricingOverrideSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  nivel: {
    type: String,
    required: true,
    enum: ['global', 'categoria', 'producto']
  },
  costos: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    ultima_actualizacion: { 
      type: Date, 
      default: Date.now 
    },
    actualizado_por: { 
      type: String 
    }
  },
  categoryId: String,
  productId: String
}, {
  timestamps: true,
  collection: 'pricingOverrides'
});

// Método estático para inicializar documentos por defecto
pricingOverrideSchema.statics.initializeDefaults = async function() {
  try {
    console.log('[PricingOverrideString] Checking if global document exists...');
    
    // Verificar si ya existe el documento global usando findOne
    const count = await this.countDocuments({ _id: 'global' });
    
    if (count === 0) {
      console.log('[PricingOverrideString] Creating global document...');
      
      // Crear datos por defecto
      const defaultGlobal = {
        _id: 'global',
        nivel: 'global',
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
          ultima_actualizacion: new Date(),
          actualizado_por: 'system'
        }
      };
      
      // Usar insertMany en lugar de create para evitar problemas de conversión
      await this.collection.insertOne(defaultGlobal);
      console.log('[PricingOverrideString] Global document created successfully');
    } else {
      console.log('[PricingOverrideString] Global document already exists');
    }
    
    return true;
  } catch (error) {
    console.error('[PricingOverrideString] Error initializing documents:', error);
    return false;
  }
};

// Crear el modelo
const PricingOverrideString = mongoose.model('PricingOverrideString', pricingOverrideSchema);

module.exports = PricingOverrideString; 