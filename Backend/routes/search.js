const express = require('express');
const router  = express.Router();
const { searchItems, getCategories, filterList } = require('../controllers/searchController');

/**
 * Search & Filter Routes (Phase 4)
 *
 * GET /api/search                  → catalog search
 *   ?q=apple&maxPrice=100&brand=organic&category=produce&sortBy=price_asc
 *
 * GET /api/search/categories       → distinct category list for filter dropdown
 *
 * GET /api/search/list/:userId     → filter within a user's shopping list
 *   ?category=dairy&status=active&q=milk
 */

// Specific routes BEFORE parameterised routes to avoid shadowing
router.get('/categories',      getCategories);
router.get('/list/:userId',    filterList);

// Main catalog search
router.get('/', searchItems);

module.exports = router;
