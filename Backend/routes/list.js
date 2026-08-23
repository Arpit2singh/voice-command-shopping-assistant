const express = require('express');
const router = express.Router();
const { getList, addItem, updateItem, removeItem } = require('../controllers/listController');

/**
 * Shopping List Routes
 *
 * GET    /api/list/:userId  → fetch all active items for a user
 * POST   /api/list          → add item (dedup-aware)
 * PATCH  /api/list/:id      → update quantity or status
 * DELETE /api/list/:id      → soft-remove item (status = 'removed')
 */

router.get('/:userId', getList);
router.post('/', addItem);
router.patch('/:id', updateItem);
router.delete('/:id', removeItem);

module.exports = router;
