// backend/controllers/pricingController.js

// Placeholder para obtener datos necesarios (ej. tipos de cambio, costo producto)
// Estos deberían interactuar con otros controladores/servicios o modelos
const getExchangeRate = async (from, to) => {
  // Lógica para obtener tipo de cambio (ej. desde DB, API externa, caché)
  console.log(`Placeholder: Obteniendo tipo de cambio ${from}/${to}`);
  // Valores de ejemplo basados en tu cálculo
  if (from === 'EUR' && to === 'USD') return 1.08; 
  if (from === 'USD' && to === 'CLP') return 950; 
  return 1; // Fallback
};

const getProductBaseCost = async (productCode) => {
  // Lógica para obtener costo base original del producto
  console.log(`Placeholder: Obteniendo costo base para ${productCode}`);
  // Valor de ejemplo
  return 100000; // Ejemplo: €100,000
};

// Obtiene el nombre y el ID de la categoría para un código de producto
const getProductCategoryAndId = async (productCode) => {
  console.log(`Placeholder: Obteniendo categoría para ${productCode}`);
  // Lógica real para buscar el producto y obtener su categoría/ID
  // Ejemplo:
  if (productCode.startsWith("CHM")) return { categoryName: "Chipeadoras Motor", categoryId: "chipeadora_motor" };
  if (productCode.startsWith("CHP")) return { categoryName: "Chipeadoras PTO", categoryId: "chipeadora_pto" };
  return { categoryName: "Desconocida", categoryId: "global" }; // Fallback a global o null?
};

// Obtiene los datos de override para una categoría específica (simula fetch interno)
const fetchCategoryOverrideData = async (categoryId) => {
  console.log(`Placeholder: Fetching override data for category ID: ${categoryId}`);
  // Lógica real para buscar el documento de override en MongoDB u otra fuente
  // Devuelve un objeto similar al que se guardaría/obtendría en categoryOverridesController
  // Ejemplo con algunos valores por defecto:
  return {
    costos: {
      tipo_cambio_eur_usd: 1.08, // Ejemplo
      buffer_usd_clp: 0.03,      // 3%
      tasa_seguro: 0.006,       // 0.6%
      buffer_transporte: 0.05,  // 5%
      margen_adicional_total: 0.35, // 35%
      descuento_fabricante: 0.10,   // 10%
      buffer_eur_usd: 0.02,         // 2%
      // ... otros campos que existen en el modelo de override
      transporte_local_eur: 1200,
      gasto_importacion_eur: 400, // Asumiendo que este corresponde a originCostsEUR
      flete_maritimo_usd: 3500,
      recargos_destino_usd: 500,
      honorarios_agente_aduana_usd: 600,
      gastos_portuarios_otros_usd: 200,
      transporte_nacional_clp: 950000,
      factor_actualizacion_anual: 0.05, // 5%
      derecho_ad_valorem: 0.06,         // 6%
      iva: 0.19                       // 19%
    }
  };
};

// --- Controlador Principal para el Cálculo --- 
const calculatePricing = async (req, res) => {
  try {
    // 1. Extraer Inputs del Request Body (ahora pueden ser opcionales para override)
    const {
      productCode,          // Sigue siendo requerido
      discountPercentage: bodyDiscount,
      yearsDifference: bodyYearsDiff,
      eurUsdBufferPercent: bodyEurUsdBuffer,
      originCostsEUR: bodyOriginCosts,
      mainFreightUSD: bodyFreight,
      destinationChargesUSD: bodyDestCharges,
      insuranceRatePercent: bodyInsuranceRate,
      customsAgentFeeUSD: bodyAgentFee,
      portExpensesUSD: bodyPortExpenses,
      nationalTransportCLP: bodyNatTransport,
      usdClpBufferPercent: bodyUsdClpBuffer,
      totalMarginPercent: bodyMargin,
      applyTLC: bodyApplyTLC, // Permitir override de TLC
      updateFactorManual: bodyUpdateFactor // Permitir override del factor de actualización
      // Añadir más parámetros si se pueden sobrescribir
    } = req.body;

    // Validación mínima
    if (!productCode) {
      return res.status(400).json({ success: false, message: 'El código de producto es requerido.' });
    }

    // 2. Obtener Categoría y Datos Predeterminados de Override
    const { categoryId } = await getProductCategoryAndId(productCode);
    const overrideData = await fetchCategoryOverrideData(categoryId);
    const defaultParams = overrideData?.costos || {}; // Usar {} si no hay overrides

    // 3. Combinar Parámetros (Prioridad: req.body > override > fallback)
    const discountPercentage = bodyDiscount ?? defaultParams.descuento_fabricante ?? 0;
    const yearsDifference = bodyYearsDiff ?? 2; // Fallback si no está en override ni body
    const eurUsdBufferPercent = bodyEurUsdBuffer ?? defaultParams.buffer_eur_usd ?? 0;
    const originCostsEUR = bodyOriginCosts ?? defaultParams.gasto_importacion_eur ?? 0; // Asumiendo mapeo
    const mainFreightUSD = bodyFreight ?? defaultParams.flete_maritimo_usd ?? 0;
    const destinationChargesUSD = bodyDestCharges ?? defaultParams.recargos_destino_usd ?? 0;
    const insuranceRatePercent = bodyInsuranceRate ?? defaultParams.tasa_seguro ?? 0;
    const customsAgentFeeUSD = bodyAgentFee ?? defaultParams.honorarios_agente_aduana_usd ?? 0;
    const portExpensesUSD = bodyPortExpenses ?? defaultParams.gastos_portuarios_otros_usd ?? 0;
    const nationalTransportCLP = bodyNatTransport ?? defaultParams.transporte_nacional_clp ?? 0;
    const usdClpBufferPercent = bodyUsdClpBuffer ?? defaultParams.buffer_usd_clp ?? 0;
    const totalMarginPercent = bodyMargin ?? defaultParams.margen_adicional_total ?? 0;
    const applyTLC = bodyApplyTLC ?? false; // Default a no aplicar TLC si no se especifica
    const factorActualizacionAnual = defaultParams.factor_actualizacion_anual ?? 0.05; // 5% fallback

    // 4. Obtener Datos Adicionales (Tipos de Cambio, Costo Base)
    const currentEurUsdRate = await getExchangeRate('EUR', 'USD'); // Podría venir de overrideData también?
    const currentUsdClpRate = await getExchangeRate('USD', 'CLP'); // Podría venir de overrideData también?
    const originalFactoryCostEUR = await getProductBaseCost(productCode);

    // --- 5. Ejecutar Lógica de Cálculo Detallada ---

    // Paso 1-5: Costo Fábrica Actualizado y con Descuento (EXW EUR)
    const updateFactor = bodyUpdateFactor ?? Math.pow(1 + factorActualizacionAnual, yearsDifference);
    const updatedFactoryCostEUR = originalFactoryCostEUR * updateFactor;
    const finalFactoryCostEUR_EXW = updatedFactoryCostEUR * (1 - discountPercentage);

    // Paso 6-9: Conversión EUR a USD con Buffer
    const appliedEurUsdRate = currentEurUsdRate * (1 + eurUsdBufferPercent);
    const finalFactoryCostUSD_EXW = finalFactoryCostEUR_EXW * appliedEurUsdRate;

    // Paso 10-14: Costos Logísticos Totales (USD)
    const originCostsUSD = originCostsEUR * appliedEurUsdRate;
    const totalFreightHandlingUSD = originCostsUSD + mainFreightUSD + destinationChargesUSD;

    // Paso 15-18: Cálculo Seguro (USD)
    const cfrApproxUSD = finalFactoryCostUSD_EXW + totalFreightHandlingUSD;
    const insuranceBaseUSD = cfrApproxUSD * 1.10; // Asegurando 110%
    const insurancePremiumUSD = insuranceBaseUSD * insuranceRatePercent;

    // Paso 19: Valor CIF (USD)
    const cifValueUSD = finalFactoryCostUSD_EXW + totalFreightHandlingUSD + insurancePremiumUSD;

    // Paso 20-24: Costos Importación (USD)
    const adValoremRate = applyTLC ? 0 : (defaultParams.derecho_ad_valorem ?? 0.06); // Usar override o fallback
    const adValoremAmountUSD = cifValueUSD * adValoremRate;
    const ivaBaseUSD = cifValueUSD + adValoremAmountUSD;
    const ivaRate = defaultParams.iva ?? 0.19; // Usar override o fallback
    const ivaAmountUSD = ivaBaseUSD * ivaRate;
    const totalImportCostsUSD = adValoremAmountUSD + customsAgentFeeUSD + portExpensesUSD;

    // Paso 25-27: Transporte Nacional (USD)
    const nationalTransportUSD = nationalTransportCLP / currentUsdClpRate;

    // Paso 28: Landed Cost (USD) - Sin IVA
    const landedCostUSD = cifValueUSD + totalImportCostsUSD + nationalTransportUSD;

    // Paso 29-31: Conversión a CLP con Buffer
    const appliedUsdClpRate = currentUsdClpRate * (1 + usdClpBufferPercent);
    const landedCostCLP = landedCostUSD * appliedUsdClpRate;

    // Paso 32-34: Aplicación Margen y Precio Venta Neto (CLP)
    const marginAmountCLP = landedCostCLP * totalMarginPercent;
    const netSalePriceCLP = landedCostCLP + marginAmountCLP;

    // Paso 35-36: Cálculo IVA Venta y Precio Venta Total (CLP)
    const saleIvaAmountCLP = netSalePriceCLP * ivaRate;
    const finalSalePriceCLP = netSalePriceCLP + saleIvaAmountCLP;

    // 6. Estructurar Respuesta
    const results = {
      inputsUsed: { // Mostrar qué valores se usaron finalmente
        productCode,
        categoryId,
        discountPercentage,
        yearsDifference,
        eurUsdBufferPercent,
        originCostsEUR,
        mainFreightUSD,
        destinationChargesUSD,
        insuranceRatePercent,
        customsAgentFeeUSD,
        portExpensesUSD,
        nationalTransportCLP,
        usdClpBufferPercent,
        totalMarginPercent,
        applyTLC,
        updateFactor,
        factorActualizacionAnual,
        adValoremRate,
        ivaRate
      },
      calculations: {
        originalFactoryCostEUR,
        updatedFactoryCostEUR,
        finalFactoryCostEUR_EXW,
        currentEurUsdRate,
        appliedEurUsdRate,
        finalFactoryCostUSD_EXW,
        originCostsUSD,
        totalFreightHandlingUSD,
        cfrApproxUSD,
        insurancePremiumUSD,
        cifValueUSD,
        adValoremAmountUSD,
        totalImportCostsUSD,
        ivaAmountUSD, // IVA de importación calculado
        currentUsdClpRate,
        nationalTransportUSD,
        landedCostUSD,
        appliedUsdClpRate,
        landedCostCLP,
        marginAmountCLP,
        netSalePriceCLP,
        saleIvaAmountCLP, // IVA de venta calculado
        finalSalePriceCLP
      }
    };

    res.status(200).json({ success: true, data: results });

  } catch (error) {
    console.error("Error calculating pricing:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor al calcular precios.", error: error.message });
  }
};

module.exports = {
  calculatePricing,
  // Exportar otras funciones si se crean más en este controlador
}; 