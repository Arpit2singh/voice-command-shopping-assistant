/**
 * apiClient.js — Centralized API layer for the Voice Shopping Assistant
 *
 * All backend calls go through here.
 * Handles:
 *  - Base URL from VITE_API_URL env var
 *  - Consistent error format: throws Error with message from backend
 *  - Network failures: wraps fetch errors
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Internal fetch wrapper with JSON handling and consistent error format.
 */
async function request(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch (networkErr) {
    throw new Error('Network error — check your connection and try again.');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Unexpected response from server (status ${res.status}).`);
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Server error (${res.status})`);
  }

  return data;
}

// ─── Shopping List API ────────────────────────────────────────────────────────

/**
 * GET /api/list/:userId
 * Returns { success, count, items }
 */
export async function fetchList(userId) {
  return request('GET', `/api/list/${encodeURIComponent(userId)}`);
}

/**
 * POST /api/list
 * Body: { userId, itemName, quantity, unit }
 * Returns { success, item }
 */
export async function addItem({ userId, itemName, quantity = 1, unit = '' }) {
  return request('POST', '/api/list', { userId, itemName, quantity, unit });
}

/**
 * PATCH /api/list/:id
 * Body: { quantity?, status? }
 * Returns { success, item }
 */
export async function updateItem(id, updates) {
  return request('PATCH', `/api/list/${encodeURIComponent(id)}`, updates);
}

/**
 * DELETE /api/list/:id  (soft-delete → status:'removed')
 * Returns { success, item }
 */
export async function removeItem(id) {
  return request('DELETE', `/api/list/${encodeURIComponent(id)}`);
}

// ─── Search API ───────────────────────────────────────────────────────────────

/**
 * GET /api/search?q=&maxPrice=&minPrice=&brand=&category=&sortBy=&limit=
 * Returns { success, count, results }
 */
export async function searchCatalog({
  q = '',
  maxPrice = null,
  minPrice = null,
  brand = null,
  category = null,
  sortBy = null,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();
  if (q)           params.set('q',        q);
  if (maxPrice !== null) params.set('maxPrice', maxPrice);
  if (minPrice !== null) params.set('minPrice', minPrice);
  if (brand)       params.set('brand',    brand);
  if (category)    params.set('category', category);
  if (sortBy)      params.set('sortBy',   sortBy);
  if (limit !== 20) params.set('limit',   limit);
  const qs = params.toString();
  return request('GET', `/api/search${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/search/categories
 * Returns { success, categories: string[] }
 */
export async function fetchCategories() {
  return request('GET', '/api/search/categories');
}

// ─── Suggestions API ──────────────────────────────────────────────────────────

/**
 * GET /api/suggestions/:userId
 * Returns { success, isNewUser, runningLow, seasonal, popular, substitutes }
 */
export async function fetchSuggestions(userId) {
  return request('GET', `/api/suggestions/${encodeURIComponent(userId)}`);
}

// ─── NLP Intent API (Groq AI Powered) ────────────────────────────────────────

/**
 * POST /api/nlp/parse
 * Body: { text, lang }
 * Returns { success, provider, intent: { action, itemName, quantity, unit } }
 */
export async function parseVoiceIntent(text, lang = 'en-IN') {
  return request('POST', '/api/nlp/parse', { text, lang });
}

