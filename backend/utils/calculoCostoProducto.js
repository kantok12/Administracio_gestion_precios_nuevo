/**
 * Calcula la sección "Costo de Producto" basado en los parámetros proporcionados,
 * incluyendo datos de un perfil de costo.
 * 
 * @param {object} params - Objeto con los parámetros de entrada.
 * @param {number} params.anoCotizacion - Año base del costo original.
 * @param {number} params.anoEnCurso - Año objetivo para el cálculo.
 * @param {number} params.costoFabricaOriginalEUR - Costo original del producto en EUR.
 * @param {number} params.tipoCambioEurUsdActual - Tasa de cambio EUR/USD sin buffer.
 * @param {object} params.perfilData - El objeto completo del perfil de costo a usar.
 * @returns {object} - Objeto con los resultados del cálculo del costo del producto.
 */
function calcularCostoProducto({
  anoCotizacion,
  anoEnCurso,
  costoFabricaOriginalEUR,
  tipoCambioEurUsdActual,
  perfilData
}) {

  // Validaciones básicas de los inputs directos
  if (costoFabricaOriginalEUR <= 0 || tipoCambioEurUsdActual <= 0 || !perfilData) {
      console.error("Error en calcularCostoProducto: Inputs inválidos o perfil faltante", { costoFabricaOriginalEUR, tipoCambioEurUsdActual, perfilDataExists: !!perfilData });
      return { error: "Inputs inválidos o perfil de costo faltante para el cálculo." }; 
  }

  // Extraer valores necesarios DESDE el perfil
  // ASUNCIÓN: Los valores _pct en el modelo se guardan como decimal (ej: 0.02)
  const bufferEurUsd = perfilData.buffer_eur_usd_pct ?? 0; 
  const descuentoFabrica = perfilData.descuento_fabrica_pct ?? 0;
  // Nuevos valores a extraer del perfil para Logística y Seguro
  const costoOrigenEUR = perfilData.costo_logistica_origen_eur ?? 0;
  const fleteMaritimoUSD = perfilData.flete_maritimo_usd ?? 0;
  const recargosDestinoUSD = perfilData.recargos_destino_usd ?? 0;
  const tasaSeguroPct = perfilData.tasa_seguro_pct ?? 0; // Asumiendo decimal

  // Validar que los valores extraídos sean números válidos
  if (typeof bufferEurUsd !== 'number' || typeof descuentoFabrica !== 'number' ||
      typeof costoOrigenEUR !== 'number' || typeof fleteMaritimoUSD !== 'number' ||
      typeof recargosDestinoUSD !== 'number' || typeof tasaSeguroPct !== 'number') {
    console.error("Error en calcularCostoProducto: Valores de perfil inválidos", { 
        bufferEurUsd, descuentoFabrica, costoOrigenEUR, fleteMaritimoUSD, 
        recargosDestinoUSD, tasaSeguroPct 
    });
    return { error: "Valores numéricos inválidos encontrados en el perfil de costo." };
  }

  // --- SECCIÓN 1: Costo de Producto --- 
  // 1. Calcular el factor de actualización
  const factorActualizacion = Math.pow(1 + 0.05, anoEnCurso - anoCotizacion);
  // 2. Costo fábrica actualizado (EUR)
  const costoFabricaActualizadoEUR = costoFabricaOriginalEUR * factorActualizacion;
  // 3. Aplicar descuento del fabricante (extraído del perfil)
  const costoFinalFabricaEUR_EXW = costoFabricaActualizadoEUR * (1 - descuentoFabrica);
  // 4. Tipo de cambio EUR/USD con buffer fijo 2%
  const tipoCambioEurUsdAplicado = tipoCambioEurUsdActual * (1 + 0.02);
  // 5. Costo final en USD (EXW)
  const costoFinalFabricaUSD_EXW = costoFinalFabricaEUR_EXW * tipoCambioEurUsdAplicado;

  // --- SECCIÓN 2: Logística y Seguro --- 
  // 6. Costos en Origen (USD)
  const costosOrigenUSD = costoOrigenEUR * tipoCambioEurUsdAplicado;
  // 7. Costo Total Flete y Manejos (USD)
  const costoTotalFleteManejosUSD = costoOrigenEUR + fleteMaritimoUSD + recargosDestinoUSD;
  // 8. Base para Seguro (CFR Aprox - USD)
  const baseParaSeguroUSD = costoFinalFabricaUSD_EXW + costoTotalFleteManejosUSD;
  // 9. Prima Seguro (USD)
  const primaSeguroUSD = (baseParaSeguroUSD * 1.1) * tasaSeguroPct; // Usando tasa del perfil (decimal)
  // 10. Total Transporte y Seguro EXW (USD)
  const totalTransporteSeguroEXW_USD = costoTotalFleteManejosUSD + primaSeguroUSD;

  // Devolver resultados estructurados
  return {
    inputs: { 
        anoCotizacion,
        anoEnCurso,
        costoFabricaOriginalEUR,
        tipoCambioEurUsdActual,
        bufferEurUsd_fromProfile: bufferEurUsd,
        descuentoFabrica_fromProfile: descuentoFabrica,
        costoOrigenEUR_fromProfile: costoOrigenEUR,
        fleteMaritimoUSD_fromProfile: fleteMaritimoUSD,
        recargosDestinoUSD_fromProfile: recargosDestinoUSD,
        tasaSeguroPct_fromProfile: tasaSeguroPct,
    },
    calculados: {
      costo_producto: {
          factorActualizacion,
          costoFabricaActualizadoEUR, 
          costoFinalFabricaEUR_EXW,
          tipoCambioEurUsdAplicado,
          costoFinalFabricaUSD_EXW
      },
      logistica_seguro: {
          costosOrigenUSD,
          costoTotalFleteManejosUSD,
          baseParaSeguroUSD,
          primaSeguroUSD,
          totalTransporteSeguroEXW_USD
      }
    }
  };
}

module.exports = {
  calcularCostoProducto
}; 