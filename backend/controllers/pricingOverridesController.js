// backend/controllers/pricingOverridesController.js

// Asumiendo Node.js v18+ con fetch global o que axios está instalado
// const axios = require('axios'); // Descomentar si prefieres usar axios

const N8N_WEBHOOK_URL = 'https://n8n-807184488368.southamerica-west1.run.app/webhook/3b286e7b-8dee-4b3a-896b-72d45e56c655';

const fetchExternalPricingOverrides = async (req, res) => {
  console.log(`Fetching external pricing overrides from N8N webhook: ${N8N_WEBHOOK_URL}`);
  try {
    // Usando fetch nativo (Node 18+)
    const response = await fetch(N8N_WEBHOOK_URL);

    // Alternativa con axios:
    // const response = await axios.get(N8N_WEBHOOK_URL);
    // const data = response.data;

    if (!response.ok) {
      let errorMsg = `Error fetching from N8N webhook: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text(); 
        console.error('N8N webhook error response body:', errorBody);
        errorMsg += ` - Body: ${errorBody}`;
      } catch (e) { /* Ignorar error leyendo body */ }
      console.error(errorMsg);
      // Usar el código de estado de la respuesta del webhook si es posible
      return res.status(response.status || 502).json({ 
          message: 'Error al contactar el servicio externo para obtener pricing overrides.', 
          details: errorMsg 
      });
    }

    const data = await response.json();
    console.log('Successfully fetched external pricing overrides from N8N:', data);
    
    // Devuelve directamente la data del webhook
    res.status(200).json(data);

  } catch (error) {
    console.error('Error processing request to fetch external pricing overrides:', error);
    let errorMessage = 'Error interno del servidor al obtener pricing overrides externos.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json({ message: errorMessage, error: error });
  }
};

module.exports = {
  fetchExternalPricingOverrides,
}; 