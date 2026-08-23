/**
 * seasonal.js — Seasonal items lookup table
 *
 * Maps month index (0 = Jan … 11 = Dec) to an array of
 * items commonly available or popular in that season (India-centric).
 *
 * Used by the Suggestions engine (Phase 3).
 * Edge case: if a month has no entry, getSuggestions gracefully returns [].
 */

const seasonalItems = {
  // January — winter peak
  0: [
    { item: 'carrot', reason: 'Winter season — gajar halwa season' },
    { item: 'radish', reason: 'Winter staple' },
    { item: 'peas', reason: 'Fresh green peas season' },
    { item: 'spinach', reason: 'Winter greens peak' },
    { item: 'cauliflower', reason: 'Gobi season' },
    { item: 'mustard oil', reason: 'Winter cooking staple' },
  ],

  // February — late winter
  1: [
    { item: 'strawberry', reason: 'Strawberry season begins' },
    { item: 'peas', reason: 'Still peak green peas season' },
    { item: 'beetroot', reason: 'Late winter vegetable' },
    { item: 'turnip', reason: 'Late winter root vegetable' },
  ],

  // March — spring
  2: [
    { item: 'mango', reason: 'Early mango varieties arrive' },
    { item: 'watermelon', reason: 'Spring fruits begin' },
    { item: 'bottle gourd', reason: 'Lauki season starts' },
    { item: 'guava', reason: 'Spring guava' },
  ],

  // April — pre-summer
  3: [
    { item: 'mango', reason: 'Peak mango season begins' },
    { item: 'watermelon', reason: 'Hydration season' },
    { item: 'cucumber', reason: 'Kheera — summer cooling' },
    { item: 'coconut water', reason: 'Summer hydration' },
    { item: 'lemon', reason: 'Nimbu pani season' },
  ],

  // May — peak summer
  4: [
    { item: 'mango', reason: 'Alphonso / Langra peak' },
    { item: 'litchi', reason: 'Summer fruit season' },
    { item: 'ice cream', reason: 'Summer treat' },
    { item: 'nimbu', reason: 'Lemonade season' },
    { item: 'buttermilk', reason: 'Chaas / cooling drinks' },
    { item: 'coconut', reason: 'Summer hydration' },
  ],

  // June — monsoon onset
  5: [
    { item: 'corn', reason: 'Monsoon bhutta season' },
    { item: 'ginger', reason: 'Chai season starts with rains' },
    { item: 'tea', reason: 'Monsoon chai' },
    { item: 'pakora mix', reason: 'Rainy day snacks' },
    { item: 'umbrella', reason: 'Monsoon essentials' },
  ],

  // July — monsoon
  6: [
    { item: 'corn', reason: 'Peak bhutta season' },
    { item: 'mushroom', reason: 'Monsoon mushrooms' },
    { item: 'ginger', reason: 'Immunity boost' },
    { item: 'honey', reason: 'Immunity support' },
  ],

  // August — mid-monsoon
  7: [
    { item: 'pomegranate', reason: 'Anaar season' },
    { item: 'pear', reason: 'Nashpati season' },
    { item: 'green tea', reason: 'Monsoon wellness' },
    { item: 'turmeric milk', reason: 'Haldi doodh — immunity' },
  ],

  // September — post-monsoon
  8: [
    { item: 'papaya', reason: 'Papaya season' },
    { item: 'pineapple', reason: 'Post-monsoon fruit' },
    { item: 'guava', reason: 'Amrood season begins' },
    { item: 'drumstick', reason: 'Moringa season' },
  ],

  // October — festive / early winter
  9: [
    { item: 'dry fruits', reason: 'Diwali preparations' },
    { item: 'ghee', reason: 'Festive sweets season' },
    { item: 'sugar', reason: 'Mithai and sweet making' },
    { item: 'besan', reason: 'Ladoo and festive snacks' },
    { item: 'makhana', reason: 'Navratri fasting snack' },
  ],

  // November — early winter
  10: [
    { item: 'carrot', reason: 'Gajar season starts' },
    { item: 'sweet potato', reason: 'Shakarkandi — winter staple' },
    { item: 'peas', reason: 'Matar season begins' },
    { item: 'orange', reason: 'Narangi season' },
    { item: 'mustard greens', reason: 'Sarson da saag season' },
  ],

  // December — winter
  11: [
    { item: 'carrot', reason: 'Peak gajar season' },
    { item: 'peas', reason: 'Fresh matar peak' },
    { item: 'amla', reason: 'Indian gooseberry — immunity' },
    { item: 'dates', reason: 'Khajoor — winter energy' },
    { item: 'sesame', reason: 'Til — winter warmth' },
    { item: 'groundnut', reason: 'Moongfali — winter snack' },
  ],
};

/**
 * Returns seasonal item suggestions for the current (or given) month.
 * @param {number} [monthIndex] — 0-indexed month. Defaults to current month.
 * @returns {Array<{item: string, reason: string}>}
 */
function getSeasonalItems(monthIndex) {
  const month = monthIndex !== undefined ? monthIndex : new Date().getMonth();
  return seasonalItems[month] || [];
}

module.exports = { getSeasonalItems, seasonalItems };
