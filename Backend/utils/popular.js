/**
 * popular.js — Curated popular/trending items
 *
 * Used as the fallback suggestion source for new users who have
 * zero purchase history. Prevents an empty suggestion panel on
 * first visit. Items are India-centric grocery staples.
 *
 * Edge case (Phase 3): New user, zero history →
 *   runningLow = [] → fall through to popular defaults.
 */

const POPULAR_ITEMS = [
  { item: 'milk',       category: 'dairy',     icon: '🥛', reason: 'Most added item' },
  { item: 'eggs',       category: 'meat',       icon: '🥚', reason: 'Weekly staple' },
  { item: 'bread',      category: 'grains',     icon: '🍞', reason: 'Daily essential' },
  { item: 'rice',       category: 'grains',     icon: '🍚', reason: 'Most popular grain' },
  { item: 'onion',      category: 'produce',    icon: '🧅', reason: 'Cooking staple' },
  { item: 'tomato',     category: 'produce',    icon: '🍅', reason: 'Cooking staple' },
  { item: 'potato',     category: 'produce',    icon: '🥔', reason: 'Versatile vegetable' },
  { item: 'banana',     category: 'produce',    icon: '🍌', reason: 'Healthy snack' },
  { item: 'dal',        category: 'pulses',     icon: '🫘', reason: 'Protein staple' },
  { item: 'atta',       category: 'grains',     icon: '🌾', reason: 'Roti staple' },
  { item: 'sugar',      category: 'spices',     icon: '🍬', reason: 'Kitchen essential' },
  { item: 'salt',       category: 'spices',     icon: '🧂', reason: 'Kitchen essential' },
  { item: 'cooking oil',category: 'condiments', icon: '🫙', reason: 'Cooking essential' },
  { item: 'tea',        category: 'beverages',  icon: '🍵', reason: 'Daily ritual' },
  { item: 'coffee',     category: 'beverages',  icon: '☕', reason: 'Morning staple' },
];

/**
 * Returns popular items not already on the active list.
 * @param {Set<string>} activeNames — lowercase set of currently active items
 * @param {number} limit
 * @returns {Array<{item,category,icon,reason,type}>}
 */
function getPopularDefaults(activeNames, limit = 6) {
  return POPULAR_ITEMS
    .filter(p => !activeNames.has(p.item.toLowerCase()))
    .slice(0, limit)
    .map(p => ({ ...p, type: 'popular' }));
}

module.exports = { getPopularDefaults, POPULAR_ITEMS };
