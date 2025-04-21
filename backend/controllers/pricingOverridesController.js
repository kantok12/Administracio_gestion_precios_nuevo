// backend/controllers/pricingOverridesController.js

// Asumiendo Node.js v18+ con fetch global o que axios está instalado
// const axios = require('axios'); // Descomentar si prefieres usar axios

const fetch = require('node-fetch');

const N8N_GET_WEBHOOK_URL = 'https://n8n-807184488368.southamerica-west1.run.app/webhook/3b286e7b-8dee-4b3a-896b-72d45e56c655';
// --- URL del Webhook N8N para GUARDAR --- 
// const N8N_SAVE_WEBHOOK_URL = process.env.N8N_SAVE_WEBHOOK || 'https://n8n-807184488368.southamerica-west1.run.app/webhook/guardar-precios'; // URL Original (Producción)
const N8N_SAVE_WEBHOOK_URL = 'https://n8n-807184488368.southamerica-west1.run.app/webhook-test/guardar-precios'; // <<< URL TEMPORAL PARA PRUEBAS
// ---------------------------------------

// Controlador para obtener datos del webhook N8N
const getPricingOverridesFromWebhook = async (req, res) => {
  // --- LEER Y LOGGEAR CATEGORÍA DEL QUERY --- 
  const category = req.query.category;
  if (category) {
    console.log(`[Backend] Received request for pricing overrides for category: ${category}`);
  } else {
    console.log('[Backend] Received request for pricing overrides (no category specified).');
  }
  // ------------------------------------------

  console.log(`[Backend] Fetching data from N8N GET webhook: ${N8N_GET_WEBHOOK_URL}`);

  try {
    // Realizar la solicitud fetch al webhook N8N
    // NOTA: Aún no usamos la 'category' para modificar la URL o la lógica de fetch.
    const response = await fetch(N8N_GET_WEBHOOK_URL);

    // Verificar si la respuesta del webhook fue exitosa (código 2xx)
    if (!response.ok) {
      // Intentar obtener más detalles del error si la respuesta es JSON
      let errorBody = 'Unknown N8N webhook error';
      try {
        errorBody = await response.json();
      } catch (jsonError) {
        // Si el cuerpo no es JSON, usar el texto
        errorBody = await response.text();
      }
      console.error(`[Backend] Error response from N8N GET webhook (${response.status}):`, errorBody);
      // Devolver un error 502 (Bad Gateway) ya que el problema está en el servicio externo
      return res.status(502).json({ message: 'Error fetching data from external service', details: errorBody });
    }

    // Si la respuesta es OK, obtener el cuerpo JSON
    const data = await response.json();
    console.log('[Backend] Successfully fetched data from N8N GET webhook.');

    // Devolver los datos obtenidos al cliente
    res.status(200).json(data);

  } catch (error) {
    // Capturar errores de red o problemas durante el fetch
    console.error('[Backend] Error during fetch operation to N8N GET webhook:', error);
    // Devolver un error 500 (Internal Server Error)
    res.status(500).json({ message: 'Internal server error during fetch operation to GET webhook', error: error.message });
  }
};

// --- NUEVO Controlador para GUARDAR datos vía webhook N8N --- 
const saveGlobalPricingOverrides = async (req, res) => {
  console.log('[Backend] Received request to save global pricing overrides.'); 
  try {
    const datos = req.body;
    console.log('[Backend] Data received from frontend:', datos);

    if (!datos || Object.keys(datos).length === 0) {
      console.error('[Backend] Empty data received from frontend.');
      return res.status(400).json({ message: 'Datos vacíos recibidos.' });
    }

    if (!N8N_SAVE_WEBHOOK_URL) {
       console.error('[Backend] N8N_SAVE_WEBHOOK URL is not configured.');
       return res.status(500).json({ message: 'La URL del webhook de guardado no está configurada en el servidor.' });
    }

    console.log(`[Backend] Sending data to N8N save webhook: ${N8N_SAVE_WEBHOOK_URL}`);
    const response = await fetch(N8N_SAVE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos) 
    });

    let resultText = await response.text();
    let resultJson = null;
    try {
        resultJson = JSON.parse(resultText);
    } catch (e) {
        console.warn('[Backend] N8N response was not valid JSON:', resultText);
    }

    console.log(`[Backend] Received response from N8N save webhook. Status: ${response.status}`);

    if (!response.ok) {
      console.error(`[Backend] Error response from N8N save webhook (${response.status}):`, resultJson || resultText);
      return res.status(response.status || 502).json({ 
        message: 'Error recibido desde el servicio de guardado (N8N).',
        detalle_n8n: resultJson || { rawResponse: resultText }
      });
    }

    console.log('[Backend] Successfully saved parameters via N8N webhook.');
    return res.status(200).json({
      message: 'Parámetros guardados correctamente vía N8N.',
      respuesta_n8n: resultJson || { rawResponse: resultText }
    });

  } catch (error) {
    console.error('[Backend] Internal error sending data to N8N save webhook:', error);
    return res.status(500).json({
      message: 'Error interno del servidor al intentar guardar los parámetros.',
      error: error.message
    });
  }
};

// --- RENOMBRAR y MODIFICAR Controlador para ACTUALIZAR DÓLAR Y EURO vía webhook N8N --- 
const updateCurrencyValues = async (req, res) => {
  console.log('[Backend] Received request to update currency values (dollar & euro).');
  try {
    // 1. Obtener los valores del cuerpo de la solicitud
    const { dolar_observado_actual, euro_observado_actual } = req.body;
    console.log('[Backend] Currency values received from frontend:', { dolar_observado_actual, euro_observado_actual });

    // 2. Validación mínima (ambos deben ser números válidos)
    if (dolar_observado_actual === undefined || dolar_observado_actual === null || typeof dolar_observado_actual !== 'number' ||
        euro_observado_actual === undefined || euro_observado_actual === null || typeof euro_observado_actual !== 'number') {
      console.error('[Backend] Invalid or missing currency values in request body.');
      return res.status(400).json({ message: 'Valores de divisas inválidos o faltantes en la solicitud.' });
    }

    // 3. Usar la MISMA URL de webhook N8N para guardar
    if (!N8N_SAVE_WEBHOOK_URL) {
       console.error('[Backend] N8N_SAVE_WEBHOOK URL is not configured.');
       return res.status(500).json({ message: 'La URL del webhook de guardado no está configurada en el servidor.' });
    }

    // 4. Crear el payload con AMBOS valores
    const payload = {
      dolar_observado_actual: dolar_observado_actual,
      euro_observado_actual: euro_observado_actual // <<< AÑADIR EURO
    };

    console.log(`[Backend] Sending updated currency values to N8N save webhook: ${N8N_SAVE_WEBHOOK_URL}`);
    console.log('[Backend] Payload for currency update:', payload);

    // 5. Enviar a N8N
    const response = await fetch(N8N_SAVE_WEBHOOK_URL, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // 6. Manejar respuesta de N8N
    let resultText = await response.text();
    let resultJson = null;
    try { resultJson = JSON.parse(resultText); } catch (e) { /* Ignorar si no es JSON */ }

    console.log(`[Backend] Received response from N8N save webhook (currency update). Status: ${response.status}`);

    if (!response.ok) {
      console.error(`[Backend] Error response from N8N save webhook (currency update - ${response.status}):`, resultJson || resultText);
      return res.status(response.status || 502).json({ 
        message: 'Error recibido desde N8N al intentar actualizar las divisas.',
        detalle_n8n: resultJson || { rawResponse: resultText }
      });
    }

    console.log('[Backend] Successfully updated currency values via N8N webhook.');
    return res.status(200).json({
      message: 'Valores de divisas actualizados correctamente vía N8N.',
      respuesta_n8n: resultJson || { rawResponse: resultText }
    });

  } catch (error) {
    console.error('[Backend] Internal error sending currency update to N8N:', error);
    return res.status(500).json({
      message: 'Error interno del servidor al intentar actualizar las divisas.',
      error: error.message
    });
  }
};
// ----------------------------------------------------------------------

// --- ACTUALIZAR EXPORTACIÓN (Renombrar updateDolarValue) --- 
module.exports = {
  getPricingOverridesFromWebhook,
  saveGlobalPricingOverrides,
  updateCurrencyValues // Usar el nuevo nombre
};
// -------------------------------------------------------

module.exports = {
  getPricingOverridesFromWebhook,
  saveGlobalPricingOverrides,
  updateCurrencyValues
}; 