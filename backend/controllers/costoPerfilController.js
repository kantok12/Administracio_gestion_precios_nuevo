const CostoPerfil = require('../models/CostoPerfil');
// Ya no necesitamos getLatestCurrencyValues aquí
// const { getLatestCurrencyValues } = require('./productController');

// @desc    Crear un nuevo perfil de costo
// @route   POST /api/costo-perfiles
// @access  Private (ejemplo, ajustar según necesidad)
const createCostoPerfil = async (req, res) => {
  try {
    const nuevoPerfil = new CostoPerfil(req.body);
    const perfilGuardado = await nuevoPerfil.save();
    res.status(201).json(perfilGuardado);
  } catch (error) {
    console.error('Error al crear perfil de costo:', error);
    res.status(400).json({ message: 'Error al crear el perfil', error: error.message });
  }
};

// @desc    Obtener todos los perfiles de costo
// @route   GET /api/costo-perfiles
// @access  Private (ejemplo)
const getAllCostoPerfiles = async (req, res) => {
  try {
    // Podríamos añadir filtros o paginación aquí si es necesario
    const perfiles = await CostoPerfil.find({});
    res.status(200).json(perfiles);
  } catch (error) {
    console.error('Error al obtener perfiles de costo:', error);
    res.status(500).json({ message: 'Error al obtener los perfiles' });
  }
};

// @desc    Obtener un perfil de costo por ID
// @route   GET /api/costo-perfiles/:id
// @access  Private (ejemplo)
const getCostoPerfilById = async (req, res) => {
  try {
    const perfil = await CostoPerfil.findById(req.params.id);
    if (!perfil) {
      return res.status(404).json({ message: 'Perfil no encontrado' });
    }
    res.status(200).json(perfil);
  } catch (error) {
    console.error('Error al obtener perfil por ID:', error);
    // Si el ID tiene un formato inválido, Mongoose puede lanzar un error
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'ID de perfil inválido' });
    }
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
};

// @desc    Actualizar un perfil de costo por ID
// @route   PUT /api/costo-perfiles/:id
// @access  Private (ejemplo)
const updateCostoPerfil = async (req, res) => {
  try {
    const perfil = await CostoPerfil.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Devuelve el doc actualizado y corre validaciones
    );
    if (!perfil) {
      return res.status(404).json({ message: 'Perfil no encontrado para actualizar' });
    }
    res.status(200).json(perfil);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'ID de perfil inválido' });
    }
    res.status(400).json({ message: 'Error al actualizar el perfil', error: error.message });
  }
};

// @desc    Eliminar un perfil de costo por ID
// @route   DELETE /api/costo-perfiles/:id
// @access  Private (ejemplo)
const deleteCostoPerfil = async (req, res) => {
  try {
    const perfil = await CostoPerfil.findByIdAndDelete(req.params.id);
    if (!perfil) {
      return res.status(404).json({ message: 'Perfil no encontrado para eliminar' });
    }
    // Importante: Considerar qué sucede con los productos/equipos que usaban este perfil.
    // Podría ser necesario reasignar un perfil por defecto o marcar esos productos.
    // La lógica de cálculo referenciada en la imagen se aplicaría en los endpoints que usan estos perfiles,
    // no directamente aquí en el CRUD del perfil mismo.
    res.status(200).json({ message: 'Perfil eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar perfil:', error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'ID de perfil inválido' });
    }
    res.status(500).json({ message: 'Error al eliminar el perfil' });
  }
};

// @desc    Calcular costos de prueba basados en inputs (manuales + perfil opcional + tasas de cambio)
// @route   POST /api/costo-perfiles/calcular-prueba
// @access  Public (o Private según necesidad)
const calculatePruebaCosto = async (req, res) => {
  try {
    // --- 1. Extract Inputs ---
    const {
      ano_cotizacion, ano_en_curso, costo_fabrica_original_eur,
      profileId,
      tipo_cambio_usd_clp_actual, tipo_cambio_eur_usd_actual,
      // Resto de parámetros (si no hay profileId)
      descuento_pct, buffer_eur_usd_pct, costos_origen_eur, flete_maritimo_usd,
      recargos_destino_usd, tasa_seguro_pct, honorarios_agente_aduana_usd,
      gastos_portuarios_otros_usd, transporte_nacional_clp, buffer_usd_clp_pct,
      margen_adicional_pct, derecho_advalorem_pct, iva_pct,
      descuento_cliente_pct // Nuevo input para modo manual
    } = req.body;

    // --- 2. Validate Essential Inputs ---
    if (typeof ano_cotizacion !== 'number' || typeof ano_en_curso !== 'number' || typeof costo_fabrica_original_eur !== 'number') {
        return res.status(400).json({ message: 'Año cotización, año en curso y costo fábrica original son requeridos y deben ser números.' });
    }
     if (ano_en_curso > ano_cotizacion) {
         return res.status(400).json({ message: 'El "Año en curso" no puede ser mayor al "Año de cotización".' });
     }
    if (typeof tipo_cambio_usd_clp_actual !== 'number' || typeof tipo_cambio_eur_usd_actual !== 'number' || tipo_cambio_usd_clp_actual <= 0 || tipo_cambio_eur_usd_actual <= 0) {
        return res.status(400).json({ message: 'Los tipos de cambio actuales (USD/CLP y EUR/USD) son requeridos, deben ser números positivos y provistos por el cliente.' });
    }

    // --- 3. Get Calculation Parameters (Profile or Manual) ---
    let params;
    if (profileId) {
        const perfil = await CostoPerfil.findById(profileId);
        if (!perfil) return res.status(404).json({ message: `Perfil con ID ${profileId} no encontrado.` });

        params = {
            descuento_pct: perfil.descuento_fabrica_pct ?? 0, // Desc. Fábrica
            buffer_eur_usd_pct: perfil.buffer_eur_usd_pct ?? 0,
            costos_origen_eur: perfil.costo_logistica_origen_eur ?? 0,
            flete_maritimo_usd: perfil.flete_maritimo_usd ?? 0,
            recargos_destino_usd: perfil.recargos_destino_usd ?? 0,
            tasa_seguro_pct: perfil.tasa_seguro_pct ?? 0,
            honorarios_agente_aduana_usd: perfil.costo_agente_aduana_usd ?? 0,
            gastos_portuarios_otros_usd: perfil.gastos_portuarios_otros_usd ?? 0,
            transporte_nacional_clp: perfil.transporte_nacional_clp ?? 0,
            buffer_usd_clp_pct: perfil.buffer_usd_clp_pct ?? 0,
            margen_adicional_pct: perfil.margen_adicional_pct ?? 0,
            derecho_advalorem_pct: perfil.derecho_advalorem_pct ?? 0.06,
            iva_pct: perfil.iva_pct ?? 0.19,
            descuento_cliente_pct: perfil.descuento_cliente_pct ?? 0 // Asumiendo que existe en el modelo
        };
    } else {
        // Manual mode - Validate all necessary inputs
        const manualParamValues = [
            descuento_pct, buffer_eur_usd_pct, costos_origen_eur, flete_maritimo_usd,
            recargos_destino_usd, tasa_seguro_pct, honorarios_agente_aduana_usd,
            gastos_portuarios_otros_usd, transporte_nacional_clp, buffer_usd_clp_pct,
            margen_adicional_pct, descuento_cliente_pct // Validar nuevo input
        ];
        if (manualParamValues.some(p => typeof p !== 'number')) {
             return res.status(400).json({ message: 'En modo manual, todos los parámetros de costos y porcentajes (incluido desc. cliente) son requeridos y deben ser números.' });
        }
        params = {
            descuento_pct, buffer_eur_usd_pct, costos_origen_eur, flete_maritimo_usd,
            recargos_destino_usd, tasa_seguro_pct, honorarios_agente_aduana_usd,
            gastos_portuarios_otros_usd, transporte_nacional_clp, buffer_usd_clp_pct,
            margen_adicional_pct,
            derecho_advalorem_pct: (typeof derecho_advalorem_pct === 'number') ? derecho_advalorem_pct : 0.06,
            iva_pct: (typeof iva_pct === 'number') ? iva_pct : 0.19,
            descuento_cliente_pct
        };
    }

    // --- 4. Perform Calculations (Grouped by Section) ---

    // == Section: Costo de Producto ==
    const factor_actualizacion = Math.pow(1 + 0.05, ano_cotizacion - ano_en_curso);
    const costo_fabrica_actualizado_eur_exw = costo_fabrica_original_eur * factor_actualizacion;
    const costo_fabrica_actualizado_eur = costo_fabrica_actualizado_eur_exw * (1 - params.descuento_pct);
    const tipo_cambio_eur_usd_aplicado = tipo_cambio_eur_usd_actual * (1 + params.buffer_eur_usd_pct);
    const costo_final_fabrica_usd_exw = costo_fabrica_actualizado_eur * tipo_cambio_eur_usd_aplicado;

    const results_costo_producto = {
        factor_actualizacion,
        costo_fabrica_actualizado_eur_exw,
        costo_fabrica_actualizado_eur,
        tipo_cambio_eur_usd_aplicado,
        costo_final_fabrica_usd_exw,
    };

    // == Section: Logística y Seguro ==
    // CORREGIDO: Usar TC Aplicado para Costos Origen USD
    const costos_origen_usd = params.costos_origen_eur * tipo_cambio_eur_usd_aplicado;
    // CORREGIDO: Usar Costos Origen USD para Flete y Manejos
    const costo_total_flete_manejos_usd = costos_origen_usd + params.flete_maritimo_usd + params.recargos_destino_usd;
    const base_para_seguro_usd = costo_final_fabrica_usd_exw + costo_total_flete_manejos_usd;
    const prima_seguro_usd = (base_para_seguro_usd * 1.1) * params.tasa_seguro_pct;
    const total_transporte_seguro_exw_usd = costo_total_flete_manejos_usd + prima_seguro_usd;

    const results_logistica_seguro = {
        costos_origen_usd,
        costo_total_flete_manejos_usd,
        base_para_seguro_usd,
        prima_seguro_usd,
        total_transporte_seguro_exw_usd,
    };

    // == Section: Importación ==
    const valor_cif_usd = costo_final_fabrica_usd_exw + total_transporte_seguro_exw_usd;
    const derecho_advalorem_usd = valor_cif_usd * params.derecho_advalorem_pct;
    const base_iva_usd = valor_cif_usd + derecho_advalorem_usd;
    const iva_usd = base_iva_usd * params.iva_pct; // IVA de importación
    const total_costos_importacion_duty_fees_usd = derecho_advalorem_usd + params.honorarios_agente_aduana_usd + params.gastos_portuarios_otros_usd;

    const results_importacion = {
        valor_cif_usd,
        derecho_advalorem_usd,
        base_iva_usd,
        iva_usd, // IVA de importación
        total_costos_importacion_duty_fees_usd,
    };

    // == Section: Landed Cost ==
    const transporte_nacional_usd = params.transporte_nacional_clp / tipo_cambio_usd_clp_actual;
    // MANTENIDO: Fórmula correcta para Landed Cost
    const precio_neto_compra_base_usd_landed = valor_cif_usd + total_costos_importacion_duty_fees_usd + transporte_nacional_usd;

    const results_landed_cost = {
        transporte_nacional_usd,
        precio_neto_compra_base_usd_landed,
    };

    // == Section: Conversión a CLP y Margen ==
    const tipo_cambio_usd_clp_aplicado = tipo_cambio_usd_clp_actual * (1 + params.buffer_usd_clp_pct);
    const precio_neto_compra_base_clp = precio_neto_compra_base_usd_landed * tipo_cambio_usd_clp_aplicado;
    const margen_clp = precio_neto_compra_base_clp * params.margen_adicional_pct;
    const precio_venta_neto_clp = precio_neto_compra_base_clp + margen_clp;

    const results_conversion_margen = {
        tipo_cambio_usd_clp_aplicado,
        precio_neto_compra_base_clp,
        margen_clp,
        precio_venta_neto_clp,
    };

    // == Section: Precios para Cliente (NUEVO) ==
    const precio_neto_venta_final_clp = precio_venta_neto_clp * (1 - params.descuento_cliente_pct);
    const iva_venta_clp = precio_neto_venta_final_clp * params.iva_pct; // IVA sobre venta final
    const precio_venta_total_cliente_clp = precio_neto_venta_final_clp + iva_venta_clp;

    const results_precios_cliente = {
        precio_neto_venta_final_clp,
        iva_venta_clp, // IVA sobre venta
        precio_venta_total_cliente_clp,
    };

    // --- 5. Structure and Send Response ---
    res.status(200).json({
        results: {
            costo_producto: results_costo_producto,
            logistica_seguro: results_logistica_seguro,
            importacion: results_importacion,
            landed_cost: results_landed_cost,
            conversion_margen: results_conversion_margen,
            precios_cliente: results_precios_cliente,
        }
    });

  } catch (error) {
    console.error('Error en calculatePruebaCosto:', error);
    // Manejar errores específicos como ID inválido de Mongoose
    if (error.kind === 'ObjectId' && profileId) {
        return res.status(400).json({ message: `ID de perfil inválido: ${profileId}` });
    }
    res.status(500).json({ message: 'Error interno al calcular los costos de prueba', error: error.message });
  }
};

module.exports = {
  createCostoPerfil,
  getAllCostoPerfiles,
  getCostoPerfilById,
  updateCostoPerfil,
  deleteCostoPerfil,
  calculatePruebaCosto
}; 