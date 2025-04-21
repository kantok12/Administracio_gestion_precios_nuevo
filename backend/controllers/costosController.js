// controllers/costosController.js
const Producto = require('../models/Producto'); // << MODELO AHORA EXISTE
const PricingOverride = require('../models/PricingOverrideString'); // << USAR MODELO ALTERNATIVO

// Controlador para obtener costos fusionados de un producto
exports.getCostos = async (req, res) => {
  const codigoProducto = req.params.codigo;
  console.log(`[Backend] Request received for costs for product code: ${codigoProducto}`);

  try {
    // 1. Buscar el producto para obtener su categoría
    const producto = await Producto.findOne({ Codigo_Producto: codigoProducto });

    if (!producto) {
      console.log(`[Backend] Product not found for code: ${codigoProducto}`);
      return res.status(404).json({ message: 'Producto no encontrado con el código proporcionado.' });
    }
    console.log(`[Backend] Found product: ${codigoProducto}, Category: ${producto.categoria}`);

    // 2. Determinar las claves (_id) de los documentos de override a buscar
    const overrideKeys = [
      'global',                         // Clave global
      `cat_${producto.categoria}`,      // Clave específica de categoría
      `prod_${codigoProducto}`          // Clave específica de producto
    ];
    console.log(`[Backend] Searching for override documents with keys: ${overrideKeys.join(', ')}`);

    // 3. Buscar todos los documentos de override relevantes de una vez
    const overrides = await PricingOverride.find({ _id: { $in: overrideKeys } });
    console.log(`[Backend] Found ${overrides.length} override documents.`);

    // 4. Fusionar los costos con la prioridad correcta: global < categoria < producto
    const globalCosts = overrides.find(o => o._id === 'global')?.costos || {};
    const categoryCosts = overrides.find(o => o._id === `cat_${producto.categoria}`)?.costos || {};
    const productCosts = overrides.find(o => o._id === `prod_${codigoProducto}`)?.costos || {};

    const costosFusionados = {
        ...globalCosts,
        ...categoryCosts,
        ...productCosts
    };
    console.log('[Backend] Merged costs calculated.');


    // 5. Devolver la respuesta
    res.status(200).json({
      codigo: codigoProducto,
      categoria: producto.categoria,
      costos: costosFusionados
    });

  } catch (error) {
    console.error(`[Backend] Error fetching costs for product ${codigoProducto}:`, error);
    res.status(500).json({ message: 'Error interno del servidor al obtener los costos.', error: error.message });
  }
}; 