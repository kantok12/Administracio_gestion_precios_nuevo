const PricingOverride = require('../models/PricingOverride');

// --- Definir funciones como constantes --- 

const getGlobalOverride = async (req, res) => {
  console.log('[Backend] Request received to get global overrides.');
  try {
    const override = await PricingOverride.findOne({ _id: 'global' });
    if (!override) {
      console.log('[Backend] Global override document not found.');
      return res.status(404).json({ message: 'Documento de override global no encontrado.' });
    }
    console.log('[Backend] Global override document found.');
    res.status(200).json(override); 
  } catch (error) {
    console.error('[Backend] Error fetching global override:', error);
    res.status(500).json({ message: 'Error interno al obtener override global.', error: error.message });
  }
};

const upsertGlobalOverride = async (req, res) => {
  console.log('[Backend] Request received to upsert global overrides.');
  try {
    const { costos, metadata } = req.body;
    if (!costos || typeof costos !== 'object') {
      return res.status(400).json({ message: 'El campo \'costos\' es requerido y debe ser un objeto.' });
    }
    const updateData = {
      nivel: 'global',
      costos: costos,
      'metadata.ultima_actualizacion': new Date(),
      ...(metadata?.actualizado_por && { 'metadata.actualizado_por': metadata.actualizado_por })
    };
    const override = await PricingOverride.findOneAndUpdate(
      { _id: 'global' }, 
      { $set: updateData }, 
      { upsert: true, new: true, runValidators: true }
    );
    console.log('[Backend] Global override upserted successfully.');
    res.status(200).json({ message: 'Override global actualizado/creado.', data: override });
  } catch (error) {
    console.error('[Backend] Error upserting global override:', error);
    res.status(500).json({ message: 'Error interno al guardar override global.', error: error.message });
  }
};

const upsertCategoryOverride = async (req, res) => {
  const categoryName = req.params.nombre;
  const categoryId = `cat_${categoryName}`;
  console.log(`[Backend] Request received to upsert category override for: ${categoryName}`);
  try {
    const { costos, metadata } = req.body;
    if (!costos || typeof costos !== 'object') {
      return res.status(400).json({ message: 'El campo \'costos\' es requerido y debe ser un objeto.' });
    }
    const updateData = {
      nivel: 'categoria',
      categoryId: categoryName, 
      costos: costos,
      'metadata.ultima_actualizacion': new Date(),
      ...(metadata?.actualizado_por && { 'metadata.actualizado_por': metadata.actualizado_por })
    };
    const override = await PricingOverride.findOneAndUpdate(
      { _id: categoryId },
      { $set: updateData },
      { upsert: true, new: true, runValidators: true }
    );
    console.log('[Backend] Category override upserted successfully.');
    res.status(200).json({ message: `Override para categoría '${categoryName}' actualizado/creado.`, data: override });
  } catch (error) {
    console.error(`[Backend] Error upserting category override ${categoryName}:`, error);
    res.status(500).json({ message: 'Error interno al guardar override de categoría.', error: error.message });
  }
};

const upsertProductOverride = async (req, res) => {
  const productCode = req.params.codigo;
  const productId = `prod_${productCode}`;
  console.log(`[Backend] Request received to upsert product override for: ${productCode}`);
  try {
    const { costos, metadata } = req.body;
    if (!costos || typeof costos !== 'object') {
      return res.status(400).json({ message: 'El campo \'costos\' es requerido y debe ser un objeto.' });
    }
    const updateData = {
      nivel: 'producto',
      productId: productCode, 
      costos: costos,
      'metadata.ultima_actualizacion': new Date(),
      ...(metadata?.actualizado_por && { 'metadata.actualizado_por': metadata.actualizado_por })
    };
    const override = await PricingOverride.findOneAndUpdate(
      { _id: productId },
      { $set: updateData },
      { upsert: true, new: true, runValidators: true }
    );
    console.log('[Backend] Product override upserted successfully.');
    res.status(200).json({ message: `Override para producto '${productCode}' actualizado/creado.`, data: override });
  } catch (error) {
    console.error(`[Backend] Error upserting product override ${productCode}:`, error);
    res.status(500).json({ message: 'Error interno al guardar override de producto.', error: error.message });
  }
};

// --- Exportar las funciones definidas --- 
module.exports = {
  getGlobalOverride,
  upsertGlobalOverride,
  upsertCategoryOverride,
  upsertProductOverride
}; 