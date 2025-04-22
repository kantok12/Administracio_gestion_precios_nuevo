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

// --- Controlador Principal para el Cálculo (Modificado para usar datos reales y respuesta completa) ---
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
    const discountPercentage = bodyDiscount ?? dbParams.descuento_fabricante ?? 0;
    const yearsDifference = bodyYearsDiff ?? 2; // Usar 2 como fallback si no viene en body ni override
    const eurUsdBufferPercent = bodyEurUsdBuffer ?? dbParams.buffer_eur_usd ?? 0;
    // Asumiendo que 'gasto_importacion_eur' en DB mapea a originCostsEUR
    const originCostsEUR = bodyOriginCosts ?? dbParams.gasto_importacion_eur ?? 0; 
    const mainFreightUSD = bodyFreight ?? dbParams.flete_maritimo_usd ?? 0;
    const destinationChargesUSD = bodyDestCharges ?? dbParams.recargos_destino_usd ?? 0;
    const insuranceRatePercent = bodyInsuranceRate ?? dbParams.tasa_seguro ?? 0;
    const customsAgentFeeUSD = bodyAgentFee ?? dbParams.honorarios_agente_aduana_usd ?? 0;
    const portExpensesUSD = bodyPortExpenses ?? dbParams.gastos_portuarios_otros_usd ?? 0;
    const nationalTransportCLP = bodyNatTransport ?? dbParams.transporte_nacional_clp ?? 0;
    const usdClpBufferPercent = bodyUsdClpBuffer ?? dbParams.buffer_usd_clp ?? 0;
    const totalMarginPercent = bodyMargin ?? dbParams.margen_adicional_total ?? 0;
    const applyTLC = bodyApplyTLC ?? false; // Default false
    const factorActualizacionAnual = dbParams.factor_actualizacion_anual ?? 0.05; // Fallback 5%
    const adValoremRate = applyTLC ? 0 : (dbParams.derecho_ad_valorem ?? 0.06); // Fallback 6%
    const ivaRate = dbParams.iva ?? 0.19; // Fallback 19%

    // 4. Obtener Datos Adicionales (Tipos de Cambio, Costo Base)
    // Prioridad: override DB > Placeholder API > fallback
    const currentEurUsdRate = dbParams.tipo_cambio_eur_usd ?? await getExchangeRate('EUR', 'USD');
    const currentUsdClpRate = dbParams.dolar_observado_actual ?? await getExchangeRate('USD', 'CLP');
    // Prioridad: body > override DB > Placeholder API > fallback
    const originalFactoryCostEUR = bodyOriginalFactoryCost ?? dbParams.costo_fabrica_original_eur ?? await getProductBaseCost(productCode);

    // --- 5. Ejecutar Lógica de Cálculo Detallada ---
    const updateFactor = bodyUpdateFactor ?? Math.pow(1 + factorActualizacionAnual, yearsDifference);
    const updatedFactoryCostEUR = originalFactoryCostEUR * updateFactor;
    const finalFactoryCostEUR_EXW = updatedFactoryCostEUR * (1 - discountPercentage);
    const appliedEurUsdRate = currentEurUsdRate * (1 + eurUsdBufferPercent);
    const finalFactoryCostUSD_EXW = finalFactoryCostEUR_EXW * appliedEurUsdRate;
    const originCostsUSD = originCostsEUR * appliedEurUsdRate;
    const totalFreightHandlingUSD = originCostsUSD + mainFreightUSD + destinationChargesUSD;
    const cfrApproxUSD = finalFactoryCostUSD_EXW + totalFreightHandlingUSD;
    const insuranceBaseUSD = cfrApproxUSD * 1.10; 
    const insurancePremiumUSD = insuranceBaseUSD * insuranceRatePercent;
    const cifValueUSD = finalFactoryCostUSD_EXW + totalFreightHandlingUSD + insurancePremiumUSD;
    const adValoremAmountUSD = cifValueUSD * adValoremRate;
    const ivaBaseUSD = cifValueUSD + adValoremAmountUSD;
    const ivaAmountUSD = ivaBaseUSD * ivaRate;
    const totalImportCostsUSD = adValoremAmountUSD + customsAgentFeeUSD + portExpensesUSD;
    const nationalTransportUSD = nationalTransportCLP / currentUsdClpRate;
    const landedCostUSD = cifValueUSD + totalImportCostsUSD + nationalTransportUSD;
    const appliedUsdClpRate = currentUsdClpRate * (1 + usdClpBufferPercent);
    const landedCostCLP = landedCostUSD * appliedUsdClpRate;
    const marginAmountCLP = landedCostCLP * totalMarginPercent;
    const netSalePriceCLP = landedCostCLP + marginAmountCLP;
    const saleIvaAmountCLP = netSalePriceCLP * ivaRate;
    const finalSalePriceCLP = netSalePriceCLP + saleIvaAmountCLP;

    // 6. Estructurar Respuesta (CORREGIDO y COMPLETO en inputsUsed)
    const results = {
      inputsUsed: { 
        // Identificación
        productCode, 
        categoryId: overrideData?._id || 'N/A', // Usar el _id del override encontrado (global o cat_...)
        // Parámetros base y de configuración (los valores *finales* usados en el cálculo)
        originalFactoryCostEUR, // El costo base ANTES de actualizar
        discountPercentage, 
        yearsDifference, 
        factorActualizacionAnual, // El factor ANUAL base
        updateFactorManual: bodyUpdateFactor, // Incluir si se envió un factor manual
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
        adValoremRate, // La tasa final usada (0 si TLC=true)
        ivaRate,
        // Tipos de cambio base (antes de buffer)
        currentEurUsdRate, 
        currentUsdClpRate  
      },
      calculations: {
        // Resultados intermedios y finales
        updateFactor, // El factor de actualización total aplicado
        updatedFactoryCostEUR, 
        finalFactoryCostEUR_EXW,
        appliedEurUsdRate, // Tipo de cambio CON buffer
        finalFactoryCostUSD_EXW, 
        originCostsUSD, 
        totalFreightHandlingUSD, 
        cfrApproxUSD, 
        insurancePremiumUSD, 
        cifValueUSD,
        adValoremAmountUSD, // El monto calculado
        totalImportCostsUSD, 
        ivaAmountUSD, // El IVA de importación calculado 
        nationalTransportUSD, 
        landedCostUSD, 
        appliedUsdClpRate, // Tipo de cambio CON buffer
        landedCostCLP,
        marginAmountCLP, 
        netSalePriceCLP, 
        saleIvaAmountCLP, // El IVA de la venta calculado
        finalSalePriceCLP
      }
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