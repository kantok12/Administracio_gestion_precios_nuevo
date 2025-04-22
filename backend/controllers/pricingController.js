// backend/controllers/pricingController.js

const PricingOverride = require('../models/PricingOverride'); // <-- Importar el modelo real

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
  if (productCode.startsWith("CHM")) return { categoryName: "Chipeadoras Motor", categoryId: "cat_chipeadora_motor" }; // <-- Asegurar prefijo si aplica
  if (productCode.startsWith("CHP")) return { categoryName: "Chipeadoras PTO", categoryId: "cat_chipeadora_pto" };
  // Decidir qué hacer si no es chipeadora. Usar 'global'? O lanzar error?
  return { categoryName: "Global", categoryId: "global" }; // Fallback a global
};

// --- MODIFICADO: Obtiene los datos de override REALES desde MongoDB ---
const fetchCategoryOverrideData = async (categoryId) => {
  console.log(`[fetchCategoryOverrideData] Attempting to fetch REAL override data for category ID: ${categoryId}`);
  try {
    // Busca primero el override específico de la categoría
    const override = await PricingOverride.findOne({ _id: categoryId });
    if (override) {
      console.log(`[fetchCategoryOverrideData] Specific override data found for ${categoryId}.`);
      return override.toObject(); // Devuelve el objeto completo
    } else {
      console.log(`[fetchCategoryOverrideData] No specific override found for ${categoryId}. Attempting fallback to global.`);
      // Si no hay específico, busca el global
      const globalOverride = await PricingOverride.findOne({ _id: 'global' });
      if (globalOverride) {
        console.log('[fetchCategoryOverrideData] Global override data found.');
        return globalOverride.toObject(); // Devuelve el objeto global
      } else {
         console.warn('[fetchCategoryOverrideData] No override data found for category and global fallback failed.');
         // Considera si devolver un objeto vacío o lanzar un error es más apropiado aquí
         return null; // O return { costos: {} }; si prefieres defaults
      }
    }
  } catch (error) {
    console.error(`[fetchCategoryOverrideData] Error fetching override data for ${categoryId}:`, error);
    // Lanzar el error para que sea manejado por el controlador principal
    throw new Error(`Error al obtener datos de override para ${categoryId}: ${error.message}`);
  }
};

// --- Controlador Principal para el Cálculo (Modificado para incluir detailedSteps) ---
const calculatePricing = async (req, res) => {
  try {
    // 1. Extraer Inputs del Request Body
    const {
      productCode,
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
      applyTLC: bodyApplyTLC,
      updateFactorManual: bodyUpdateFactor,
      originalFactoryCostEUR: bodyOriginalFactoryCost // Permitir override del costo base si viene del body
    } = req.body;

    // Validación mínima
    if (!productCode) {
      return res.status(400).json({ success: false, message: 'El código de producto es requerido.' });
    }

    // 2. Obtener Categoría y Datos Reales de Override desde DB
    const { categoryId } = await getProductCategoryAndId(productCode);
    const overrideData = await fetchCategoryOverrideData(categoryId); // Llama a la función real
    // Extraer los costos del override o usar un objeto vacío si no hay overrideData o costos
    const dbParams = overrideData?.costos || {}; 

    // 3. Combinar Parámetros (Prioridad: req.body > override DB > fallback/placeholders)
    // Nota: Los valores de override (dbParams) ya deberían estar en formato decimal gracias al Schema
    const discountPercentage = bodyDiscount ?? dbParams.descuento_fabricante ?? 0.10; // Ejemplo: default 10%
    const yearsDifference = bodyYearsDiff ?? 2; // Ejemplo: default 2 años
    const eurUsdBufferPercent = (bodyEurUsdBuffer ?? dbParams.buffer_eur_usd) ?? 0.02; // Ejemplo: default 2%
    const originCostsEUR = bodyOriginCosts ?? dbParams.transporte_local_eur + (dbParams.gasto_importacion_eur || 0) ?? 1200; // Sumar locales + importación si existen, fallback 1200
    const mainFreightUSD = bodyFreight ?? dbParams.flete_maritimo_usd ?? 3500; // Ejemplo: default 3500
    const destinationChargesUSD = bodyDestCharges ?? dbParams.recargos_destino_usd ?? 500; // Ejemplo: default 500
    const insuranceRatePercent = (bodyInsuranceRate ?? dbParams.tasa_seguro) ?? 0.006; // Ejemplo: default 0.6%
    const customsAgentFeeUSD = bodyAgentFee ?? dbParams.honorarios_agente_aduana_usd ?? 600; // Ejemplo: default 600
    const portExpensesUSD = bodyPortExpenses ?? dbParams.gastos_portuarios_otros_usd ?? 200; // Ejemplo: default 200
    const nationalTransportCLP = bodyNatTransport ?? dbParams.transporte_nacional_clp ?? 950000; // Ejemplo: default 950000
    const usdClpBufferPercent = (bodyUsdClpBuffer ?? dbParams.buffer_usd_clp) ?? 0.03; // Ejemplo: default 3%
    const totalMarginPercent = (bodyMargin ?? dbParams.margen_adicional_total) ?? 0.35; // Ejemplo: default 35%
    const applyTLC = bodyApplyTLC ?? false; // Default false
    const factorActualizacionAnual = dbParams.factor_actualizacion_anual ?? 0.05; // Fallback 5%
    const adValoremRate = applyTLC ? 0 : (dbParams.derecho_ad_valorem ?? 0.06); // Fallback 6%
    const ivaRate = dbParams.iva ?? 0.19; // Fallback 19%

    // 4. Obtener Datos Adicionales 
    const currentEurUsdRate = dbParams.tipo_cambio_eur_usd ?? 1.08; // Ejemplo: default 1.08
    const currentUsdClpRate = dbParams.dolar_observado_actual ?? 950; // Ejemplo: default 950
    const originalFactoryCostEUR = bodyOriginalFactoryCost ?? dbParams.costo_fabrica_original_eur ?? 100000; // Ejemplo: default 100000

    // --- 5. Ejecutar Lógica de Cálculo Detallada Y REGISTRAR PASOS ---
    const detailedSteps = []; // <<< INICIALIZAR ARRAY

    // Registrar Inputs clave como "pasos" iniciales
    detailedSteps.push({ step: 1, description: "Costo Fábrica Original (EUR)", value: originalFactoryCostEUR, currency: "EUR" });
    detailedSteps.push({ step: 2, description: "Años Diferencia", value: yearsDifference });
    // (Añadir otros inputs relevantes si se desea verlos explícitamente al inicio)
    detailedSteps.push({ step: 6, description: "Tipo Cambio EUR/USD Actual", value: currentEurUsdRate });
    detailedSteps.push({ step: 7, description: "Buffer % EUR/USD", value: eurUsdBufferPercent });
    detailedSteps.push({ step: 10, description: "Costos en Origen (EUR)", value: originCostsEUR, currency: "EUR" });
    detailedSteps.push({ step: 12, description: "Flete Marítimo Principal (USD)", value: mainFreightUSD, currency: "USD" });
    detailedSteps.push({ step: 13, description: "Recargos Destino (USD)", value: destinationChargesUSD, currency: "USD" });
    detailedSteps.push({ step: 16, description: "Tasa Seguro (%)", value: insuranceRatePercent });
     detailedSteps.push({ step: 23, description: "Honorarios Agente Aduana (USD)", value: customsAgentFeeUSD, currency: "USD" });
     detailedSteps.push({ step: 24, description: "Gastos Portuarios/Otros (USD)", value: portExpensesUSD, currency: "USD" });
     detailedSteps.push({ step: 25, description: "Transporte Nacional (CLP)", value: nationalTransportCLP, currency: "CLP" });
     detailedSteps.push({ step: 26, description: "Tipo Cambio USD/CLP Actual (Observado)", value: currentUsdClpRate });
     detailedSteps.push({ step: 29, description: "Buffer % USD/CLP", value: usdClpBufferPercent });
     detailedSteps.push({ step: 32, description: "% Adicional Total (Margen sobre Costo)", value: totalMarginPercent });
    // ... (puedes añadir más inputs si es necesario)

    // Cálculos y registro
    const updateFactor = bodyUpdateFactor ?? Math.pow(1 + factorActualizacionAnual, yearsDifference);
    detailedSteps.push({ step: 3, description: "Factor Actualización", value: updateFactor });

    const updatedFactoryCostEUR = originalFactoryCostEUR * updateFactor;
    detailedSteps.push({ step: 4, description: "Costo Fábrica Actualizado (EUR)", value: updatedFactoryCostEUR, currency: "EUR" });

    const finalFactoryCostEUR_EXW = updatedFactoryCostEUR * (1 - discountPercentage);
    detailedSteps.push({ step: 5, description: "Costo Final Fábrica (EUR) - EXW", value: finalFactoryCostEUR_EXW, currency: "EUR" });
    
    const appliedEurUsdRate = currentEurUsdRate * (1 + eurUsdBufferPercent);
    detailedSteps.push({ step: 8, description: "Tipo Cambio EUR/USD Aplicado", value: appliedEurUsdRate });

    const finalFactoryCostUSD_EXW = finalFactoryCostEUR_EXW * appliedEurUsdRate;
    detailedSteps.push({ step: 9, description: "Costo Final Fábrica (USD) - EXW", value: finalFactoryCostUSD_EXW, currency: "USD" });

    const originCostsUSD = originCostsEUR * appliedEurUsdRate;
    detailedSteps.push({ step: 11, description: "Costos en Origen (USD)", value: originCostsUSD, currency: "USD" });

    const totalFreightHandlingUSD = originCostsUSD + mainFreightUSD + destinationChargesUSD;
    detailedSteps.push({ step: 14, description: "Costo Total Flete y Manejos (USD)", value: totalFreightHandlingUSD, currency: "USD" });

    const cfrApproxUSD = finalFactoryCostUSD_EXW + totalFreightHandlingUSD;
    detailedSteps.push({ step: 15, description: "Base para Seguro (CFR Aprox - USD)", value: cfrApproxUSD, currency: "USD" });

    const insuranceBaseUSD = cfrApproxUSD * 1.10; 
    // Podríamos añadir un paso para insuranceBaseUSD si quisiéramos verlo
    // detailedSteps.push({ step: 16.5, description: "Valor Asegurado (110% CFR)", value: insuranceBaseUSD, currency: "USD" });

    const insurancePremiumUSD = insuranceBaseUSD * insuranceRatePercent;
    detailedSteps.push({ step: 17, description: "Prima Seguro (USD)", value: insurancePremiumUSD, currency: "USD" });
    
    // Este paso 18 no parece necesario si el 19 es CIF = EXW + FleteManejos + Seguro
    // const totalTransporteSeguroEXWUSD = totalFreightHandlingUSD + insurancePremiumUSD;
    // detailedSteps.push({ step: 18, description: "Total Transporte y Seguro EXW (USD)", value: totalTransporteSeguroEXWUSD, currency: "USD" });

    const cifValueUSD = finalFactoryCostUSD_EXW + totalFreightHandlingUSD + insurancePremiumUSD; // CIF = EXW + Flete/Manejos + Seguro
    detailedSteps.push({ step: 19, description: "Valor CIF (USD)", value: cifValueUSD, currency: "USD" });

    const adValoremAmountUSD = cifValueUSD * adValoremRate;
    detailedSteps.push({ step: 20, description: `Derecho Ad Valorem (${adValoremRate * 100}%) (USD)`, value: adValoremAmountUSD, currency: "USD" });

    const ivaBaseUSD = cifValueUSD + adValoremAmountUSD;
    detailedSteps.push({ step: 21, description: "Base IVA (USD)", value: ivaBaseUSD, currency: "USD" });

    const ivaAmountUSD = ivaBaseUSD * ivaRate;
    detailedSteps.push({ step: 22, description: `IVA (${ivaRate * 100}%) (USD)`, value: ivaAmountUSD, currency: "USD" });
    
    // Este cálculo de "totalImportCostsUSD" no parece coincidir exactamente con el paso 28. El paso 28 suma CIF + AdValorem + Agente + Otros + TranspNacUSD.
    // const totalImportCostsUSD = adValoremAmountUSD + customsAgentFeeUSD + portExpensesUSD; 
    // detailedSteps.push({ step: XX, description: "Costos Importación (AdVal+Agente+Otros) USD", value: totalImportCostsUSD, currency: "USD" });

    const nationalTransportUSD = nationalTransportCLP / currentUsdClpRate;
    detailedSteps.push({ step: 27, description: "Transporte Nacional (USD)", value: nationalTransportUSD, currency: "USD" });

    // Recalcular Landed Cost según descripción paso 28
    const landedCostUSD = cifValueUSD + adValoremAmountUSD + customsAgentFeeUSD + portExpensesUSD + nationalTransportUSD;
    detailedSteps.push({ step: 28, description: "Precio Neto Compra Base (USD) o "Landed Cost"", value: landedCostUSD, currency: "USD" });

    const appliedUsdClpRate = currentUsdClpRate * (1 + usdClpBufferPercent);
    detailedSteps.push({ step: 30, description: "Tipo Cambio USD/CLP Aplicado", value: appliedUsdClpRate });

    const landedCostCLP = landedCostUSD * appliedUsdClpRate;
    detailedSteps.push({ step: 31, description: "Precio Neto Compra Base (CLP)", value: landedCostCLP, currency: "CLP" });

    const marginAmountCLP = landedCostCLP * totalMarginPercent;
    detailedSteps.push({ step: 33, description: `Margen (${totalMarginPercent * 100}% sobre Costo) (CLP)`, value: marginAmountCLP, currency: "CLP" });

    const netSalePriceCLP = landedCostCLP + marginAmountCLP;
    detailedSteps.push({ step: 34, description: "Precio Venta Neto (CLP)", value: netSalePriceCLP, currency: "CLP" });

    const saleIvaAmountCLP = netSalePriceCLP * ivaRate;
    detailedSteps.push({ step: 35, description: `IVA Venta (${ivaRate * 100}%) (CLP)`, value: saleIvaAmountCLP, currency: "CLP" });

    const finalSalePriceCLP = netSalePriceCLP + saleIvaAmountCLP;
    detailedSteps.push({ step: 36, description: "Precio Venta Total Cliente (CLP)", value: finalSalePriceCLP, currency: "CLP" });


    // 6. Estructurar Respuesta (AÑADIR detailedSteps)
    const results = {
      // Mantener inputsUsed y calculations por si son útiles en otro lado
      inputsUsed: { 
        productCode, 
        categoryId: overrideData?._id || 'N/A', 
        originalFactoryCostEUR, 
        discountPercentage, 
        yearsDifference, 
        factorActualizacionAnual, 
        updateFactorManual: bodyUpdateFactor,
        eurUsdBufferPercent, 
        originCostsEUR, // El valor combinado usado
        mainFreightUSD,
        destinationChargesUSD, 
        insuranceRatePercent, 
        customsAgentFeeUSD, 
        portExpensesUSD,
        nationalTransportCLP, 
        usdClpBufferPercent, 
        totalMarginPercent, 
        applyTLC,
        adValoremRate, // Tasa final
        ivaRate,
        currentEurUsdRate, // Tasa base
        currentUsdClpRate  // Tasa base
      },
      calculations: {
        // Los resultados finales de cada cálculo importante
        updateFactor, 
        updatedFactoryCostEUR, 
        finalFactoryCostEUR_EXW,
        appliedEurUsdRate, 
        finalFactoryCostUSD_EXW, 
        originCostsUSD, 
        totalFreightHandlingUSD, 
        cfrApproxUSD, 
        insurancePremiumUSD, 
        cifValueUSD,
        adValoremAmountUSD, 
        ivaAmountUSD, 
        nationalTransportUSD, 
        landedCostUSD, 
        appliedUsdClpRate, 
        landedCostCLP,
        marginAmountCLP, 
        netSalePriceCLP, 
        saleIvaAmountCLP, 
        finalSalePriceCLP
      },
      // --- Añadir el array de pasos detallados ---
      detailedSteps: detailedSteps 
      // -------------------------------------------
    };

    res.status(200).json({ success: true, data: results });

  } catch (error) {
    console.error("Error calculating pricing:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor al calcular precios.", error: error.message });
  }
};

// Exportar solo la función de cálculo principal como solicitado
module.exports = {
  calculatePricing
}; 