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
  // Validar que los valores extraídos sean números válidos (podrían ser undefined si el perfil no los tiene)
  if (typeof bufferEurUsd !== 'number' || typeof descuentoFabrica !== 'number') {
    console.error("Error en calcularCostoProducto: Valores de perfil inválidos", { bufferEurUsd, descuentoFabrica });
    return { error: "Valores de buffer o descuento inválidos en el perfil de costo." };
  }

  // 1. Calcular el factor de actualización
  // *** AJUSTE: Usar (añoEnCurso - anoCotizacion) como exponente para proyectar hacia el futuro ***
  const factorActualizacion = Math.pow(1 + 0.05, anoEnCurso - anoCotizacion);

  // 2. Costo fábrica actualizado (EUR)
  const costoFabricaActualizadoEUR = costoFabricaOriginalEUR * factorActualizacion;

  // 3. Aplicar descuento del fabricante (extraído del perfil)
  const costoFinalFabricaEUR_EXW = costoFabricaActualizadoEUR * (1 - descuentoFabrica);

  // 4. Tipo de cambio EUR/USD con buffer
  // *** AJUSTE: Usar un buffer fijo de 0.02 (2%) en lugar del valor del perfil ***
  const tipoCambioEurUsdAplicado = tipoCambioEurUsdActual * (1 + 0.02);

  // 5. Costo final en USD
  const costoFinalFabricaUSD_EXW = costoFinalFabricaEUR_EXW * tipoCambioEurUsdAplicado;

  // Devolver resultados estructurados
  return {
    inputs: { // Devolver inputs usados puede ser útil para debug
        anoCotizacion,
        anoEnCurso,
        costoFabricaOriginalEUR,
        tipoCambioEurUsdActual,
        // Incluir los valores usados del perfil
        bufferEurUsd_fromProfile: bufferEurUsd,
        descuentoFabrica_fromProfile: descuentoFabrica,
    },
    calculados: {
        factorActualizacion,
        costoFabricaActualizadoEUR,
        costoFinalFabricaEUR_EXW,
        tipoCambioEurUsdAplicado,
        costoFinalFabricaUSD_EXW
    }
  };
}

module.exports = {
  calcularCostoProducto
}; 