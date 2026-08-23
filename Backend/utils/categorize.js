/**
 * categorize.js — Auto-categorization utility
 *
 * Maps item name keywords → category strings.
 * Matching is substring-based (case-insensitive) so partial
 * words still resolve (e.g. "almond milk" → "dairy").
 *
 * Edge case: item not in map → returns 'uncategorized', never throws.
 */

const categoryMap = {
  // ── Dairy ──────────────────────────────────────────────────
  milk: 'dairy',
  doodh: 'dairy',     // Hindi alias
  dudh: 'dairy',      // Bengali alias
  cheese: 'dairy',
  curd: 'dairy',
  dahi: 'dairy',      // Hindi alias
  paneer: 'dairy',
  butter: 'dairy',
  ghee: 'dairy',
  cream: 'dairy',
  yogurt: 'dairy',
  lassi: 'dairy',

  // ── Produce ────────────────────────────────────────────────
  apple: 'produce',
  seb: 'produce',     // Hindi alias
  banana: 'produce',
  kela: 'produce',    // Hindi alias
  tomato: 'produce',
  tamatar: 'produce', // Hindi alias
  potato: 'produce',
  aloo: 'produce',    // Hindi alias
  onion: 'produce',
  pyaz: 'produce',    // Hindi alias
  spinach: 'produce',
  palak: 'produce',   // Hindi alias
  carrot: 'produce',
  gajar: 'produce',   // Hindi alias
  mango: 'produce',
  aam: 'produce',     // Hindi alias
  orange: 'produce',
  grape: 'produce',
  lemon: 'produce',
  nimbu: 'produce',   // Hindi alias
  cucumber: 'produce',
  kheera: 'produce',  // Hindi alias
  capsicum: 'produce',
  broccoli: 'produce',
  cauliflower: 'produce',
  gobi: 'produce',    // Hindi alias

  // ── Snacks ─────────────────────────────────────────────────
  chips: 'snacks',
  biscuit: 'snacks',
  cookie: 'snacks',
  namkeen: 'snacks',
  popcorn: 'snacks',
  cracker: 'snacks',
  wafer: 'snacks',
  pretzel: 'snacks',
  nuts: 'snacks',
  cashew: 'snacks',
  almond: 'snacks',
  peanut: 'snacks',
  chocolate: 'snacks',
  candy: 'snacks',

  // ── Beverages ──────────────────────────────────────────────
  juice: 'beverages',
  tea: 'beverages',
  chai: 'beverages',  // Hindi alias
  coffee: 'beverages',
  water: 'beverages',
  soda: 'beverages',
  cola: 'beverages',
  lemonade: 'beverages',
  smoothie: 'beverages',
  shake: 'beverages',

  // ── Grains & Staples ────────────────────────────────────────
  rice: 'grains',
  chawal: 'grains',   // Hindi alias
  wheat: 'grains',
  gehu: 'grains',     // Hindi alias
  flour: 'grains',
  atta: 'grains',     // Hindi alias
  bread: 'grains',
  pasta: 'grains',
  noodle: 'grains',
  oats: 'grains',
  quinoa: 'grains',
  roti: 'grains',

  // ── Pulses & Legumes ────────────────────────────────────────
  lentil: 'pulses',
  dal: 'pulses',      // Hindi alias
  daal: 'pulses',
  chickpea: 'pulses',
  chana: 'pulses',    // Hindi alias
  rajma: 'pulses',    // kidney beans
  bean: 'pulses',
  pea: 'pulses',
  matar: 'pulses',    // Hindi alias

  // ── Meat & Seafood ──────────────────────────────────────────
  chicken: 'meat',
  murga: 'meat',      // Hindi alias
  mutton: 'meat',
  lamb: 'meat',
  fish: 'seafood',
  prawn: 'seafood',
  shrimp: 'seafood',
  egg: 'meat',
  anda: 'meat',       // Hindi alias

  // ── Frozen Foods ────────────────────────────────────────────
  icecream: 'frozen',
  'ice cream': 'frozen',
  frozen: 'frozen',

  // ── Spices & Condiments ─────────────────────────────────────
  salt: 'spices',
  namak: 'spices',    // Hindi alias
  sugar: 'spices',
  cheeni: 'spices',   // Hindi alias
  pepper: 'spices',
  kali: 'spices',
  turmeric: 'spices',
  haldi: 'spices',    // Hindi alias
  cumin: 'spices',
  jeera: 'spices',    // Hindi alias
  chilli: 'spices',
  mirchi: 'spices',   // Hindi alias
  masala: 'spices',
  sauce: 'condiments',
  ketchup: 'condiments',
  mustard: 'condiments',
  mayonnaise: 'condiments',
  vinegar: 'condiments',
  oil: 'condiments',
  tel: 'condiments',  // Hindi alias

  // ── Cleaning & Household ────────────────────────────────────
  soap: 'household',
  sabun: 'household', // Hindi alias
  shampoo: 'household',
  detergent: 'household',
  bleach: 'household',
  tissue: 'household',
  towel: 'household',
  toothpaste: 'household',
  toothbrush: 'household',
};

/**
 * Returns the category for the given item name.
 * Uses substring matching so "almond milk" resolves to "dairy" (not "snacks")
 * because "milk" appears in the name. Priority is given to the FIRST match.
 *
 * @param {string} itemName
 * @returns {string} category string or 'uncategorized'
 */
function categorize(itemName) {
  if (!itemName || typeof itemName !== 'string') return 'uncategorized';

  const normalized = itemName.toLowerCase().trim();

  const matchedKey = Object.keys(categoryMap).find(key =>
    normalized.includes(key)
  );

  return matchedKey ? categoryMap[matchedKey] : 'uncategorized';
}

module.exports = { categorize, categoryMap };
