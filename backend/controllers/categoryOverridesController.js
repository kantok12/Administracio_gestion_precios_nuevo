const PricingOverride = require('../models/PricingOverride');

// --- Controlador para obtener parámetros de una categoría específica ---
const getCategoryOverride = async (req, res) => {
  const categoryId = req.params.categoryId;
  console.log(`[Backend] Request received to get category overrides for: ${categoryId}`);
  
  try {
    const override = await PricingOverride.findOne({ _id: categoryId });
    if (!override) {
      console.log(`[Backend] Category override document not found for: ${categoryId}`);
      return res.status(404).json({ message: `Documento de override para categoría '${categoryId}' no encontrado.` });
    }
    console.log(`[Backend] Category override document found for: ${categoryId}`);
    res.status(200).json(override);
  } catch (error) {
    console.error(`[Backend] Error fetching category override for ${categoryId}:`, error);
    res.status(500).json({ 
      message: 'Error interno al obtener override de categoría.', 
      error: error.message 
    });
  }
};

// --- Controlador para actualizar o crear parámetros de categoría ---
const upsertCategoryOverride = async (req, res) => {
  const categoryId = req.params.categoryId;
  console.log(`[Backend] Request received to upsert category override for: ${categoryId}`);
  
  try {
    const { costos, metadata, nivel, categoryName } = req.body;
    
    if (!costos || typeof costos !== 'object') {
      return res.status(400).json({ 
        message: 'El campo \'costos\' es requerido y debe ser un objeto.' 
      });
    }
    
    const updateData = {
      nivel: nivel || 'categoria',
      categoryId: categoryName || categoryId,
      costos: costos,
      'metadata.ultima_actualizacion': new Date(),
      ...(metadata?.actualizado_por && { 'metadata.actualizado_por': metadata.actualizado_por })
    };
    
    const override = await PricingOverride.findOneAndUpdate(
      { _id: categoryId },
      { $set: updateData },
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log(`[Backend] Category override upserted successfully for: ${categoryId}`);
    res.status(200).json({ 
      message: `Override para categoría '${categoryId}' actualizado/creado.`, 
      data: override 
    });
  } catch (error) {
    console.error(`[Backend] Error upserting category override for ${categoryId}:`, error);
    res.status(500).json({ 
      message: 'Error interno al guardar override de categoría.', 
      error: error.message 
    });
  }
};

// --- Controlador para inicializar o crear un documento de categoría con valores default ---
const initializeCategoryOverride = async (req, res) => {
  try {
    // Obtener primero los parámetros globales para usarlos como base
    const globalOverride = await PricingOverride.findOne({ _id: 'global' });
    
    if (!globalOverride) {
      return res.status(404).json({ 
        message: 'No se encontró el documento global para inicializar la categoría.' 
      });
    }
    
    const { categoryId, categoryName } = req.body;
    
    if (!categoryId) {
      return res.status(400).json({ 
        message: 'El ID de categoría es requerido para inicializar un documento de categoría.' 
      });
    }
    
    // Verificar si ya existe este documento de categoría
    const existingCategory = await PricingOverride.findOne({ _id: categoryId });
    
    if (existingCategory) {
      return res.status(409).json({ 
        message: `Ya existe un documento para la categoría '${categoryId}'.`,
        data: existingCategory
      });
    }
    
    // Crear una copia del documento global pero adaptada para categoría
    const newCategoryOverride = {
      _id: categoryId,
      nivel: 'categoria',
      categoryId: categoryName || categoryId,
      costos: { ...globalOverride.costos }, // Copiar todos los costos del global
      metadata: {
        ultima_actualizacion: new Date(),
        actualizado_por: req.body.metadata?.actualizado_por || 'system'
      }
    };
    
    // Insertar el nuevo documento de categoría
    const categoryDoc = await PricingOverride.create(newCategoryOverride);
    
    res.status(201).json({ 
      message: `Documento de categoría '${categoryId}' inicializado exitosamente.`, 
      data: categoryDoc 
    });
  } catch (error) {
    console.error('[Backend] Error initializing category override:', error);
    res.status(500).json({ 
      message: 'Error interno al inicializar documento de categoría.', 
      error: error.message 
    });
  }
};

// --- Controlador para inicializar la categoría "categoria_chipeadora" ---
const initializeChipeadoraOverride = async (req, res) => {
  try {
    // Verificar si ya existe el documento de chipeadora
    const existingChipeadora = await PricingOverride.findOne({ _id: 'categoria_chipeadora' });
    
    if (existingChipeadora) {
      return res.status(200).json({ 
        message: 'El documento para Chipeadora ya existe.',
        data: existingChipeadora
      });
    }
    
    // Definir la estructura para la categoría chipeadora
    const chipeadoraOverride = {
      _id: "categoria_chipeadora",
      nivel: "categoria",
      categoryId: "Chipeadora Motor",
      costos: {
        tipo_cambio_eur_usd: 1.2,
        buffer_usd_clp: 0.018000000000000002,
        buffer_eur_usd: 0.02,
        tasa_seguro: 0.006,
        margen_adicional_total: 0.35,
        buffer_transporte: 0.05,
        descuento_fabricante: 0.1,
        costo_fabrica_original_eur: 100000,
        transporte_local_eur: 800,
        gasto_importacion_eur: 400,
        flete_maritimo_usd: 3500,
        recargos_destino_usd: 500,
        honorarios_agente_aduana_usd: 600,
        gastos_portuarios_otros_usd: 200,
        transporte_nacional_clp: 950000,
        factor_actualizacion_anual: 0.05,
        derecho_ad_valorem: 0.06,
        iva: 0.19,
        fecha_ultima_actualizacion_transporte_local: "2025-04-14",
        dolar_observado_actual: 969
      },
      metadata: {
        ultima_actualizacion: new Date("2025-04-21T00:00:00Z"),
        actualizado_por: "admin"
      }
    };
    
    // Insertar el documento para chipeadora
    const chipeadoraDoc = await PricingOverride.create(chipeadoraOverride);
    
    res.status(201).json({ 
      message: 'Documento para Chipeadora inicializado exitosamente.', 
      data: chipeadoraDoc 
    });
  } catch (error) {
    console.error('[Backend] Error initializing chipeadora override:', error);
    res.status(500).json({ 
      message: 'Error interno al inicializar documento para Chipeadora.', 
      error: error.message 
    });
  }
};

// --- Controlador para inicializar la categoría "chipeadora_motor" ---
const initializeChipeadoraMotorOverride = async (req, res) => {
  try {
    // Verificar si ya existe el documento
    const existingChipeadora = await PricingOverride.findOne({ _id: 'chipeadora_motor' });
    
    if (existingChipeadora) {
      return res.status(200).json({ 
        message: 'El documento para Chipeadora Motor ya existe.',
        data: existingChipeadora
      });
    }
    
    // Obtener primero el documento de chipeadora general como base
    const chipeadoraBase = await PricingOverride.findOne({ _id: 'categoria_chipeadora' });
    
    if (!chipeadoraBase) {
      return res.status(404).json({ 
        message: 'No se encontró el documento base de chipeadora para inicializar Chipeadora Motor.' 
      });
    }
    
    // Definir la estructura basada en chipeadora pero con valores específicos
    const chipeadoraMotorOverride = {
      _id: "chipeadora_motor",
      nivel: "categoria",
      categoryId: "Chipeadora Motor",
      costos: { 
        ...chipeadoraBase.costos,
        // Sobrescribir valores específicos para Chipeadora Motor
        margen_adicional_total: 0.4, // 40% de margen
        costo_fabrica_original_eur: 110000, // Mayor costo de fábrica
        tasa_seguro: 0.008 // Mayor tasa de seguro
      },
      metadata: {
        ultima_actualizacion: new Date(),
        actualizado_por: "admin"
      }
    };
    
    // Insertar el documento
    const chipeadoraDoc = await PricingOverride.create(chipeadoraMotorOverride);
    
    res.status(201).json({ 
      message: 'Documento para Chipeadora Motor inicializado exitosamente.', 
      data: chipeadoraDoc 
    });
  } catch (error) {
    console.error('[Backend] Error initializing Chipeadora Motor override:', error);
    res.status(500).json({ 
      message: 'Error interno al inicializar documento para Chipeadora Motor.', 
      error: error.message 
    });
  }
};

// --- Controlador para inicializar la categoría "chipeadora_pto" ---
const initializeChipeadoraPTOOverride = async (req, res) => {
  try {
    // Verificar si ya existe el documento
    const existingChipeadora = await PricingOverride.findOne({ _id: 'chipeadora_pto' });
    
    if (existingChipeadora) {
      return res.status(200).json({ 
        message: 'El documento para Chipeadora PTO ya existe.',
        data: existingChipeadora
      });
    }
    
    // Obtener primero el documento de chipeadora general como base
    const chipeadoraBase = await PricingOverride.findOne({ _id: 'categoria_chipeadora' });
    
    if (!chipeadoraBase) {
      return res.status(404).json({ 
        message: 'No se encontró el documento base de chipeadora para inicializar Chipeadora PTO.' 
      });
    }
    
    // Definir la estructura basada en chipeadora pero con valores específicos
    const chipeadoraPTOOverride = {
      _id: "chipeadora_pto",
      nivel: "categoria",
      categoryId: "Chipeadora PTO",
      costos: { 
        ...chipeadoraBase.costos,
        // Sobrescribir valores específicos para Chipeadora PTO
        margen_adicional_total: 0.3, // 30% de margen
        costo_fabrica_original_eur: 90000, // Menor costo de fábrica
        transporte_local_eur: 750, // Menor costo de transporte
        transporte_nacional_clp: 900000 // Menor costo de transporte nacional
      },
      metadata: {
        ultima_actualizacion: new Date(),
        actualizado_por: "admin"
      }
    };
    
    // Insertar el documento
    const chipeadoraDoc = await PricingOverride.create(chipeadoraPTOOverride);
    
    res.status(201).json({ 
      message: 'Documento para Chipeadora PTO inicializado exitosamente.', 
      data: chipeadoraDoc 
    });
  } catch (error) {
    console.error('[Backend] Error initializing Chipeadora PTO override:', error);
    res.status(500).json({ 
      message: 'Error interno al inicializar documento para Chipeadora PTO.', 
      error: error.message 
    });
  }
};

// --- Controlador para inicializar todas las categorías de chipeadoras ---
const initializeAllChipeadoraCategories = async (req, res) => {
  try {
    const results = {
      categoria_chipeadora: null,
      chipeadora_motor: null,
      chipeadora_pto: null
    };
    let hasErrors = false;
    
    // 1. Inicializar categoria_chipeadora
    try {
      let existingChipeadora = await PricingOverride.findOne({ _id: 'categoria_chipeadora' });
      
      if (!existingChipeadora) {
        // Definir la estructura para la categoría chipeadora
        const chipeadoraOverride = {
          _id: "categoria_chipeadora",
          nivel: "categoria",
          categoryId: "Chipeadora Motor",
          costos: {
            tipo_cambio_eur_usd: 1.2,
            buffer_usd_clp: 0.018000000000000002,
            buffer_eur_usd: 0.02,
            tasa_seguro: 0.006,
            margen_adicional_total: 0.35,
            buffer_transporte: 0.05,
            descuento_fabricante: 0.1,
            costo_fabrica_original_eur: 100000,
            transporte_local_eur: 800,
            gasto_importacion_eur: 400,
            flete_maritimo_usd: 3500,
            recargos_destino_usd: 500,
            honorarios_agente_aduana_usd: 600,
            gastos_portuarios_otros_usd: 200,
            transporte_nacional_clp: 950000,
            factor_actualizacion_anual: 0.05,
            derecho_ad_valorem: 0.06,
            iva: 0.19,
            fecha_ultima_actualizacion_transporte_local: "2025-04-14",
            dolar_observado_actual: 969
          },
          metadata: {
            ultima_actualizacion: new Date("2025-04-21T00:00:00Z"),
            actualizado_por: "admin"
          }
        };
        existingChipeadora = await PricingOverride.create(chipeadoraOverride);
      }
      
      results.categoria_chipeadora = {
        success: true,
        message: 'Documento para Categoría Chipeadora procesado exitosamente.',
        isNew: !existingChipeadora,
        data: existingChipeadora
      };
    } catch (error) {
      results.categoria_chipeadora = {
        success: false,
        message: 'Error al procesar Categoría Chipeadora',
        error: error.message
      };
      hasErrors = true;
    }
    
    // 2. Inicializar chipeadora_motor
    try {
      let existingChipeadoraMotor = await PricingOverride.findOne({ _id: 'chipeadora_motor' });
      
      if (!existingChipeadoraMotor) {
        const baseDoc = await PricingOverride.findOne({ _id: 'categoria_chipeadora' });
        
        if (!baseDoc) {
          throw new Error('No se encontró el documento base de chipeadora');
        }
        
        const chipeadoraMotorOverride = {
          _id: "chipeadora_motor",
          nivel: "categoria",
          categoryId: "Chipeadora Motor",
          costos: { 
            ...baseDoc.costos,
            margen_adicional_total: 0.4,
            costo_fabrica_original_eur: 110000,
            tasa_seguro: 0.008
          },
          metadata: {
            ultima_actualizacion: new Date(),
            actualizado_por: "admin"
          }
        };
        
        existingChipeadoraMotor = await PricingOverride.create(chipeadoraMotorOverride);
      }
      
      results.chipeadora_motor = {
        success: true,
        message: 'Documento para Chipeadora Motor procesado exitosamente.',
        isNew: !existingChipeadoraMotor,
        data: existingChipeadoraMotor
      };
    } catch (error) {
      results.chipeadora_motor = {
        success: false,
        message: 'Error al procesar Chipeadora Motor',
        error: error.message
      };
      hasErrors = true;
    }
    
    // 3. Inicializar chipeadora_pto
    try {
      let existingChipeadoraPTO = await PricingOverride.findOne({ _id: 'chipeadora_pto' });
      
      if (!existingChipeadoraPTO) {
        const baseDoc = await PricingOverride.findOne({ _id: 'categoria_chipeadora' });
        
        if (!baseDoc) {
          throw new Error('No se encontró el documento base de chipeadora');
        }
        
        const chipeadoraPTOOverride = {
          _id: "chipeadora_pto",
          nivel: "categoria",
          categoryId: "Chipeadora PTO",
          costos: { 
            ...baseDoc.costos,
            margen_adicional_total: 0.3,
            costo_fabrica_original_eur: 90000,
            transporte_local_eur: 750,
            transporte_nacional_clp: 900000
          },
          metadata: {
            ultima_actualizacion: new Date(),
            actualizado_por: "admin"
          }
        };
        
        existingChipeadoraPTO = await PricingOverride.create(chipeadoraPTOOverride);
      }
      
      results.chipeadora_pto = {
        success: true,
        message: 'Documento para Chipeadora PTO procesado exitosamente.',
        isNew: !existingChipeadoraPTO,
        data: existingChipeadoraPTO
      };
    } catch (error) {
      results.chipeadora_pto = {
        success: false,
        message: 'Error al procesar Chipeadora PTO',
        error: error.message
      };
      hasErrors = true;
    }
    
    // Respuesta final
    if (hasErrors) {
      res.status(207).json({
        message: 'Inicialización completada con algunos errores',
        results
      });
    } else {
      res.status(200).json({
        message: 'Todas las categorías de Chipeadoras inicializadas exitosamente',
        results
      });
    }
  } catch (error) {
    console.error('[Backend] Error initializing all chipeadora categories:', error);
    res.status(500).json({ 
      message: 'Error interno al inicializar categorías de Chipeadora.', 
      error: error.message 
    });
  }
};

module.exports = {
  getCategoryOverride,
  upsertCategoryOverride,
  initializeCategoryOverride,
  initializeChipeadoraOverride,
  initializeChipeadoraMotorOverride,
  initializeChipeadoraPTOOverride,
  initializeAllChipeadoraCategories
}; 