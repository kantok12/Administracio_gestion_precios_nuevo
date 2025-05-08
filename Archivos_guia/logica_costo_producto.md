# Lógica de Cálculo de Costo de Producto

**Nota Importante:** Este documento describe un modelo detallado para el cálculo de costos. Es crucial verificar que esta lógica se alinea con la implementación actual en el código del backend (revisar `controllers/productController.js`, `controllers/costoPerfilController.js` y modelos relacionados) y con cualquier cambio reciente en los procesos de negocio. La precisión de los tipos de cambio API y los costos fijos también debe ser validada periódicamente.

Este documento describe el proceso paso a paso para calcular el costo final de un producto, desde el costo de fábrica hasta el precio total para el cliente, considerando el IVA dentro del **Landed Cost**.

## 1. Costo de Fábrica

- **Año de cotización:** _(Se escribe)_
- **Año en curso:** _(Se escribe)_
- **Factor Actualización:** `(1 + 0,05) ^ (Año en curso – Año de cotización)`
- **Costo Fábrica Original (EUR):** _(Se escribe)_
- **Costo Fábrica Actualizado (EUR):** `Costo Fábrica Original * Factor Actualización`
- **Descuento (%):** _(Ej: 10% = 0.10)_ _(Se escribe)_
- **Costo Final Fábrica (EUR) - EXW:** `Costo Actualizado * (1 - Descuento)`
- **Tipo Cambio EUR/USD Actual:** _(Obtenido por API)_
- **Buffer % EUR/USD:** _(Ej: 4% = 0.04)_
- **Tipo Cambio EUR/USD Aplicado:** `Cambio Actual * (1 + Buffer)`
- **Costo Final Fábrica (USD) - EXW:** `Costo Final Fábrica (EUR) * Tipo Cambio Aplicado`

## 2. Logística y Seguro (EXW a Chile)

- **Costos en Origen (EUR):** _(Se escribe)_
- **Costos en Origen (USD):** `Costos Origen (EUR) * Tipo Cambio EUR/USD Aplicado`
- **Flete Marítimo Principal (USD):** _(Se escribe)_
- **Recargos Destino (USD):** _(Se escribe)_
- **Costo Total Flete y Manejos (USD):** `Costos Origen (USD) + Flete + Recargos`
- **Base para Seguro (USD):** `Costo Final Fábrica (USD) + Costo Flete y Manejos`
- **Tasa Seguro (%):** _(Ej: 0.006 para 0.6%)_
- **Prima Seguro (USD):** `Base para Seguro * 1.1 * Tasa Seguro`
- **Total Transporte y Seguro EXW (USD):** `Flete + Recargos + Costos Origen (USD) + Prima Seguro`

## 3. Costos de Importación

- **Valor CIF (USD):** `Costo Fábrica (USD) + Transporte y Seguro`
- **Derecho Ad Valorem (6%):** `Valor CIF * 0.06`
- **Base IVA (USD):** `Valor CIF + Derecho Ad Valorem`
- **IVA (19%):** `Base IVA * 0.19`
- **Honorarios Agente Aduana (USD):** _(Se escribe)_
- **Gastos Portuarios / Otros (USD):** _(Se escribe)_
- **Total Costos de Importación (USD):** `Derecho Ad Valorem + Aduana + Otros`

## 4. Costo Puesto en Bodega (Landed Cost)

- **Transporte Nacional (CLP):** _(Se escribe)_
- **Tipo Cambio USD/CLP Actual (Observado):** _(Obtenido por API)_
- **Transporte Nacional (USD):** `Transporte Nacional (CLP) / Tipo Cambio USD/CLP`
- **Precio Neto Compra Base (USD) - Landed Cost:**  
  `Valor CIF + Derecho Ad Valorem + IVA + Honorarios Aduana + Gastos Otros + Transporte Nacional (USD)`

✅ **Nota:** Este modelo **sí incluye el IVA** como parte del costo base total (Landed Cost), tal como se refleja en el Excel.

## 5. Conversión a CLP y Margen

- **Buffer % USD/CLP:** _(Ej: 3% = 0.03)_
- **Tipo Cambio USD/CLP Aplicado:** `Tipo Cambio USD/CLP * (1 + Buffer)`
- **Precio Neto Compra Base (CLP):** `Precio Landed Cost USD * Tipo Cambio USD/CLP Aplicado`
- **% Adicional Total (Margen):** _(Se escribe)_
- **Margen (CLP):** `Precio Neto Compra CLP * Margen`
- **Precio Venta Neto (CLP):** `Precio Neto Compra CLP + Margen`

## 6. Precio Final para Cliente

- **Descuento a Cliente (%):** _(Ej: 5% = 0.05)_
- **Precio Neto Venta Final (CLP):** `Precio Venta Neto * (1 - Descuento)`
- **IVA Venta (CLP):** `Precio Neto Venta Final * 0.19`
- **Precio Venta Total Cliente (CLP):** `Neto Venta Final + IVA`

## Resumen de Campos de Entrada

A continuación se listan los campos que requieren una entrada manual por parte del usuario y aquellos que se obtienen automáticamente a través de una API externa.

### Entrada Manual (Se escribe)

*   Año de cotización
*   Año en curso
*   Costo Fabrica Original (EUR)
*   Descuento (%)
*   Buffer % EUR/USD
*   Costos en Origen (EUR)
*   Flete Marítimo Principal (USD)
*   Recargos Destino (THC, etc.) (USD)
*   Tasa Seguro (%)
*   Honorarios Agente Aduana (USD)
*   Gastos Portuarios/Otros (USD)
*   Transporte Nacional (CLP)
*   Buffer % USD/CLP
*   % Adicional Total (Margen sobre Costo)
*   Descuento a Cliente (%)

### Obtenido por API

*   Tipo Cambio EUR/USD Actual
*   Tipo Cambio USD/CLP Actual (Observado) 