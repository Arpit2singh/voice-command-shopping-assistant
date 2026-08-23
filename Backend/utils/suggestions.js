const PurchaseHistory   = require('../models/PurchaseHistory');
const ShoppingListItem  = require('../models/ShoppingListItem');
const Item              = require('../models/Item');
const { getSeasonalItems }   = require('./seasonal');
const { getPopularDefaults } = require('./popular');

/**
 * getSuggestions — Complete Smart Suggestions Engine (Phase 3)
 *
 * Returns four suggestion buckets:
 *
 *  runningLow  — items bought 3+ times, not on active list
 *  seasonal    — in-season items this month, not on active list
 *  popular     — curated defaults shown ONLY when runningLow is empty (new user)
 *  substitutes — for each active-list item that has mapped substitutes in the
 *                catalog, suggest an alternative (e.g. "almond milk" for "milk")
 *
 * Phase 3 edge cases:
 *  - New user, zero history  → runningLow = []; popular defaults shown instead
 *  - One-off purchases       → frequency >= 3 threshold prevents noise
 *  - Suggested item on list  → filtered out at both server + client side
 *  - Item has no substitute  → substitutes array empty → section hidden in UI
 *  - Catalog has no items    → Item.find returns [] → substitutes = [] gracefully
 *
 * @param {string} userId
 * @returns {Promise<{runningLow, seasonal, popular, substitutes}>}
 */
async function getSuggestions(userId) {
  // Fetch all data in parallel for speed
  const [history, activeList] = await Promise.all([
    PurchaseHistory.find({ userId }).sort({ frequency: -1 }).lean(),
    ShoppingListItem.find({ userId, status: 'active' }).lean(),
  ]);

  const activeNames = new Set(activeList.map(i => i.itemName.toLowerCase()));

  // ── 1. Running Low ────────────────────────────────────────────
  // Items the user has bought 3+ times that aren't currently on their list
  const runningLow = history
    .filter(h => h.frequency >= 3 && !activeNames.has(h.itemName.toLowerCase()))
    .slice(0, 5)
    .map(h => ({
      type:      'running_low',
      item:      h.itemName,
      frequency: h.frequency,
    }));

  // ── 2. Seasonal ───────────────────────────────────────────────
  const seasonalRaw = getSeasonalItems();
  const seasonal = seasonalRaw
    .filter(s => !activeNames.has(s.item.toLowerCase()))
    .map(s => ({ type: 'seasonal', item: s.item, reason: s.reason }));

  // ── 3. Popular Defaults (new user fallback) ───────────────────
  // Only shown when runningLow is empty — prevents overwhelming the panel
  const popular = runningLow.length === 0
    ? getPopularDefaults(activeNames, 6)
    : [];

  // ── 4. Substitutes ────────────────────────────────────────────
  // For each active list item, look up its catalog entry and surface substitutes.
  // Edge case: Item not in catalog or no substitutes → skip (never crash).
  let substitutes = [];
  if (activeList.length > 0) {
    const activeItemNames = activeList.map(i => i.itemName.toLowerCase());

    // Look up catalog entries that have substitutes defined
    const catalogItems = await Item.find({
      name: { $in: activeItemNames },
      substitutes: { $exists: true, $not: { $size: 0 } },
    }).lean();

    substitutes = catalogItems
      .flatMap(catalogItem =>
        (catalogItem.substitutes || [])
          // Don't suggest a substitute that's already on the list
          .filter(sub => !activeNames.has(sub.toLowerCase()))
          .map(sub => ({
            type:        'substitute',
            item:        sub,
            forItem:     catalogItem.name,
            reason:      `Alternative to ${catalogItem.name}`,
          }))
      )
      // Deduplicate: same substitute might be suggested for multiple items
      .filter((s, idx, arr) => arr.findIndex(x => x.item === s.item) === idx)
      .slice(0, 4);
  }

  return { runningLow, seasonal, popular, substitutes };
}

module.exports = { getSuggestions };
