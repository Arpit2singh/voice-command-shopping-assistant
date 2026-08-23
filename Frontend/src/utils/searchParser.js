/**
 * searchParser.js — Extract structured search filters from a voice transcript (Phase 4)
 *
 * Parses: "find apples under 50 rupees organic in dairy"
 * Returns: { query: 'apples', maxPrice: 50, brand: 'organic', category: 'dairy', sortBy: null }
 *
 * Edge cases:
 *  - "under abc dollars" → invalid price → maxPrice stays null (filter ignored)
 *  - No price mentioned  → maxPrice: null
 *  - No brand mentioned  → brand: null
 *  - No category heard   → category: null
 *  - Empty transcript    → all fields null/empty
 *  - Special regex chars in query → passed to backend which escapes them
 */

const SEARCH_VERB_PATTERN = /\b(find me|search for|show me|look for|find|search|show)\b/gi;

// Price: "under 100", "under ₹100", "under Rs 100", "below 50 rupees", "cheaper than 200"
const PRICE_PATTERN = /(?:under|below|less than|cheaper than|max|upto|up to)\s+(?:rs\.?|₹|\$|rupees?)?\s*(\d+\.?\d*)/i;

// Min price: "above 50", "more than 100", "over ₹200"
const MIN_PRICE_PATTERN = /(?:above|more than|over|at least|minimum|min)\s+(?:rs\.?|₹|\$|rupees?)?\s*(\d+\.?\d*)/i;

// Brand / type qualifier
const BRAND_PATTERN = /\b(organic|generic|branded|local|fresh|natural|premium|imported|desi|homemade)\b/i;

// Category extraction: "in dairy", "from produce section", "under snacks"
const CATEGORY_PATTERN = /\b(?:in|from|under|category)\s+(dairy|produce|snacks|beverages|grains|pulses|meat|seafood|spices|condiments|household|frozen)\b/i;

// Sort order extraction: "cheapest first", "by price", "alphabetically", "lowest price"
const SORT_PATTERN = /\b(cheapest|lowest price|price ascending|price low to high|expensive|highest price|price descending|price high to low|alphabetical|by name)\b/i;

const SORT_MAP = {
  cheapest: 'price_asc',
  'lowest price': 'price_asc',
  'price ascending': 'price_asc',
  'price low to high': 'price_asc',
  expensive: 'price_desc',
  'highest price': 'price_desc',
  'price descending': 'price_desc',
  'price high to low': 'price_desc',
  alphabetical: 'name',
  'by name': 'name',
};

/**
 * @param {string} transcript
 * @returns {{ query: string, maxPrice: number|null, minPrice: number|null, brand: string|null, category: string|null, sortBy: string|null }}
 */
export function parseSearchQuery(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return { query: '', maxPrice: null, minPrice: null, brand: null, category: null, sortBy: null };
  }

  const text = transcript.trim().slice(0, 300);

  // ── Extract price filters ──────────────────────────────────────
  const priceMatch    = text.match(PRICE_PATTERN);
  const maxPrice      = priceMatch ? Number(priceMatch[1]) : null;

  const minPriceMatch = text.match(MIN_PRICE_PATTERN);
  const minPrice      = minPriceMatch ? Number(minPriceMatch[1]) : null;

  // ── Extract brand/type filter ─────────────────────────────────
  const brandMatch = text.match(BRAND_PATTERN);
  const brand      = brandMatch ? brandMatch[1].toLowerCase() : null;

  // ── Extract category filter ───────────────────────────────────
  const categoryMatch = text.match(CATEGORY_PATTERN);
  const category      = categoryMatch ? categoryMatch[1].toLowerCase() : null;

  // ── Extract sort order ────────────────────────────────────────
  const sortMatch = text.match(SORT_PATTERN);
  const sortBy    = sortMatch ? (SORT_MAP[sortMatch[1].toLowerCase()] || null) : null;

  // ── Clean item name ───────────────────────────────────────────
  const query = text
    .replace(SEARCH_VERB_PATTERN, '')
    .replace(PRICE_PATTERN, '')
    .replace(MIN_PRICE_PATTERN, '')
    .replace(BRAND_PATTERN, '')
    .replace(CATEGORY_PATTERN, '')
    .replace(SORT_PATTERN, '')
    .replace(/\b(under|above|below|over|rs\.?|₹|\$|rupees?|category|in|from)\b/gi, '')
    .replace(/[,?.!]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { query, maxPrice, minPrice, brand, category, sortBy };
}

/**
 * Build a human-readable summary of active filters for display in UI.
 * e.g. "organic · under ₹100 · dairy"
 */
export function describeFilters({ maxPrice, minPrice, brand, category, sortBy }) {
  const parts = [];
  if (brand)    parts.push(brand);
  if (category) parts.push(category);
  if (maxPrice) parts.push(`under ₹${maxPrice}`);
  if (minPrice) parts.push(`above ₹${minPrice}`);
  if (sortBy === 'price_asc')  parts.push('cheapest first');
  if (sortBy === 'price_desc') parts.push('most expensive first');
  if (sortBy === 'name')       parts.push('A–Z');
  return parts.join(' · ');
}
