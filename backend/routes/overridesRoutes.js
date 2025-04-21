const express = require('express');
const {
  upsertGlobalOverride,
  upsertCategoryOverride,
  upsertProductOverride,
  getGlobalOverride
} = require('../controllers/overridesController');

const router = express.Router();

// GET /api/overrides/global
router.get('/global', getGlobalOverride);

// PUT /api/overrides/global
router.put('/global', upsertGlobalOverride);

// PUT /api/overrides/categoria/:nombre
router.put('/categoria/:nombre', upsertCategoryOverride);

// PUT /api/overrides/producto/:codigo
router.put('/producto/:codigo', upsertProductOverride);

module.exports = router; 