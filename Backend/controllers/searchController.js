const Item             = require('../models/Item');
const ShoppingListItem = require('../models/ShoppingListItem');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * escapeRegex — Prevent ReDoS / injection attacks.
 * Phase 4 edge case: special chars in query (`.`, `+`) → always escaped.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/search
 *   ?q=apple              — full-text keyword (name + aliases + brand)
 *   ?maxPrice=100         — price ceiling (₹)
 *   ?brand=organic        — brand / type keyword
 *   ?category=dairy       — category exact match
 *   ?inStock=true         — omit items with price = null (treated as out-of-stock)
 *   ?sortBy=price_asc|price_desc|name  — result ordering
 *   ?limit=20             — max results (default 20, max 50)
 *
 * Phase 4 edge cases:
 *  - No results            → { success:true, count:0, results:[] }
 *  - Invalid maxPrice      → NaN → filter ignored gracefully
 *  - Regex injection chars → escaped before $regex
 *  - Empty q               → no name filter (returns all or filtered by other params)
 */
async function searchItems(req, res, next) {
  try {
    const { q, maxPrice, minPrice, brand, category, sortBy, limit: limitStr } = req.query;

    const filter = {};

    // ── Keyword search (name + aliases + brand) ───────────────────
    if (q && q.trim()) {
      const safe = escapeRegex(q.trim());
      filter.$or = [
        { name:    { $regex: safe, $options: 'i' } },
        { aliases: { $regex: safe, $options: 'i' } },
        { brand:   { $regex: safe, $options: 'i' } },
      ];
    }

    // ── Price range ───────────────────────────────────────────────
    const priceFilter = {};
    if (maxPrice !== undefined) {
      const p = Number(maxPrice);
      if (Number.isFinite(p) && p >= 0) priceFilter.$lte = p;
      // Invalid value → silently ignored per Phase 4 spec
    }
    if (minPrice !== undefined) {
      const p = Number(minPrice);
      if (Number.isFinite(p) && p >= 0) priceFilter.$gte = p;
    }
    if (Object.keys(priceFilter).length) filter.price = priceFilter;

    // ── Brand filter ──────────────────────────────────────────────
    if (brand && brand.trim()) {
      filter.brand = { $regex: escapeRegex(brand.trim()), $options: 'i' };
    }

    // ── Category filter ───────────────────────────────────────────
    if (category && category.trim()) {
      filter.category = category.trim().toLowerCase();
    }

    // ── Limit ─────────────────────────────────────────────────────
    const limit = Math.min(Number.isFinite(Number(limitStr)) ? Number(limitStr) : 20, 50);

    // ── Sort ──────────────────────────────────────────────────────
    let sort = {};
    if (sortBy === 'price_asc')  sort = { price: 1 };
    else if (sortBy === 'price_desc') sort = { price: -1 };
    else if (sortBy === 'name')  sort = { name: 1 };
    else sort = { name: 1 }; // default

    const results = await Item.find(filter).sort(sort).limit(limit).lean();

    res.json({ success: true, count: results.length, results });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/search/categories
 * Returns the distinct list of categories in the catalog.
 * Used by the frontend to populate the category filter dropdown.
 */
async function getCategories(req, res, next) {
  try {
    const categories = await Item.distinct('category');
    res.json({ success: true, categories: categories.sort() });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/list/:userId/filter
 *   ?category=dairy       — filter shopping list by category
 *   ?status=active        — filter by status (default: active)
 *   ?q=milk               — keyword search within list
 *
 * Lets users filter/search within their existing shopping list.
 * Phase 4 — in-list search and filter.
 */
async function filterList(req, res, next) {
  try {
    const { userId } = req.params;
    const { category, status = 'active', q } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const filter = { userId, status };

    if (category && category.trim()) {
      filter.category = category.trim().toLowerCase();
    }

    if (q && q.trim()) {
      const safe = escapeRegex(q.trim());
      filter.itemName = { $regex: safe, $options: 'i' };
    }

    const items = await ShoppingListItem.find(filter).sort({ addedAt: -1 }).lean();
    res.json({ success: true, count: items.length, items });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchItems, getCategories, filterList };
