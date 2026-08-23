/**
 * intentParser.js — Rule-based voice intent parser (Phase 2)
 *
 * Parses a voice transcript into a structured intent object:
 *   { action, itemName, quantity, unit }
 *
 * Supported actions: 'add' | 'remove' | 'search' | 'unknown'
 *
 * Edge cases handled:
 *  - No verb → action = 'unknown' (frontend shows ConfirmChip defaulting to 'add')
 *  - Empty itemName after stripping → itemName = ''
 *  - Very long transcripts → only first matched action + noun phrase used
 *  - Numeric quantities + units extracted (e.g. "2 kg", "3 bottles")
 *  - Multilingual mixed input passes through (backend alias map handles it)
 */

const REMOVE_PATTERN = /\b(remove|delete|take off|cross off|drop)\b/i;
const ADD_PATTERN    = /\b(add|need|want|buy|get me|get|put|i want|i need|purchase)\b/i;
const SEARCH_PATTERN = /\b(find|search|look for|show me|search for|where is|locate)\b/i;

const QTY_PATTERN  = /(\d+\.?\d*)\s*(bottles?|bottle|kg|kgs?|grams?|g|pcs?|pieces?|dozen|dozens?|litres?|liters?|l|ml|pack|packs?|bag|bags?|cans?|box|boxes?)?/i;

// Words to strip after extracting action and quantity
const NOISE_PATTERN = /\b(from my list|to my list|from the list|to the list|of|my|the|a|an|some|please|now)\b/gi;

/**
 * @param {string} transcript
 * @returns {{ action: string, itemName: string, quantity: number, unit: string }}
 */
export function parseIntent(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return { action: 'unknown', itemName: '', quantity: 1, unit: '' };
  }

  // Cap to 200 chars to handle rambling transcripts (Phase 2 edge case)
  const text = transcript.toLowerCase().trim().slice(0, 200);

  // ── Determine action ──────────────────────────────────────────
  let action = 'unknown';
  if (REMOVE_PATTERN.test(text)) action = 'remove';
  else if (SEARCH_PATTERN.test(text)) action = 'search';
  else if (ADD_PATTERN.test(text)) action = 'add';

  // ── Extract quantity + unit ───────────────────────────────────
  const qtyMatch = text.match(QTY_PATTERN);
  const quantity = qtyMatch && qtyMatch[1] ? Math.max(1, Math.floor(parseFloat(qtyMatch[1]))) : 1;
  const unit     = qtyMatch && qtyMatch[2] ? qtyMatch[2].toLowerCase().replace(/s$/, '') : '';

  // ── Extract item name ─────────────────────────────────────────
  let itemName = text
    .replace(REMOVE_PATTERN, '')
    .replace(ADD_PATTERN, '')
    .replace(SEARCH_PATTERN, '')
    .replace(QTY_PATTERN, '')
    .replace(NOISE_PATTERN, '')
    .replace(/[,?.!]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Normalize: collapse spaces, capitalize nothing (backend normalizes)
  itemName = itemName.replace(/\s+/g, ' ').trim();

  return { action, itemName, quantity, unit };
}

/**
 * Returns true when the parsed intent should trigger a ConfirmChip:
 *  - action is 'unknown' (no verb detected) but itemName is non-empty
 */
export function needsConfirmation({ action, itemName }) {
  return action === 'unknown' && itemName.length > 0;
}
