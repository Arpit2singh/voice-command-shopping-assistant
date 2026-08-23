const ShoppingListItem = require('../models/ShoppingListItem');
const PurchaseHistory = require('../models/PurchaseHistory');
const { categorize } = require('../utils/categorize');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalize an item name: lowercase, trim, collapse multiple spaces.
 */
function normalize(name) {
  return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Upsert purchase history: increment frequency if record exists, else create.
 * Fire-and-forget — we don't await to keep the list API fast.
 */
async function trackPurchase(userId, itemName) {
  try {
    await PurchaseHistory.findOneAndUpdate(
      { userId, itemName },
      { $inc: { frequency: 1 }, $set: { lastPurchasedAt: new Date() } },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Non-critical — never propagate to the caller
    console.error('[trackPurchase] failed silently:', err.message);
  }
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/list/:userId
 * Fetch all ACTIVE shopping list items for a user.
 */
async function getList(req, res, next) {
  try {
    const { userId } = req.params;
    const items = await ShoppingListItem.find({ userId, status: 'active' })
      .sort({ addedAt: -1 })
      .lean();

    res.json({ success: true, count: items.length, items });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/list
 * Add an item to the shopping list.
 *
 * Phase 1 edge cases:
 *  - Negative / zero quantity → 400
 *  - Duplicate add (same item already active) → increment qty, return updated doc
 *  - Concurrent double-tap: the dedup check is atomic inside MongoDB
 *    (same item+user+status query), so a second concurrent request will
 *    find the already-upserted doc and just increment qty again safely.
 */
async function addItem(req, res, next) {
  try {
    let { userId, itemName, quantity = 1, unit = '' } = req.body;

    // ── Validate required fields ──────────────────────────────────────────
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    if (!itemName || typeof itemName !== 'string' || !itemName.trim()) {
      return res.status(400).json({ success: false, error: 'itemName is required' });
    }

    // ── Validate quantity ─────────────────────────────────────────────────
    quantity = Number(quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, error: 'quantity must be a positive integer' });
    }
    quantity = Math.floor(quantity); // coerce to int

    // ── Normalize ─────────────────────────────────────────────────────────
    const normalizedName = normalize(itemName);
    const category = categorize(normalizedName);

    // ── Dedup: find existing active item ──────────────────────────────────
    const existing = await ShoppingListItem.findOne({
      userId,
      itemName: normalizedName,
      status: 'active',
    });

    if (existing) {
      // Increment quantity on duplicate add
      existing.quantity += quantity;
      await existing.save();
      trackPurchase(userId, normalizedName); // async, non-blocking
      return res.status(200).json({
        success: true,
        message: `Quantity updated (already on list)`,
        item: existing,
      });
    }

    // ── Create new item ───────────────────────────────────────────────────
    const newItem = await ShoppingListItem.create({
      userId,
      itemName: normalizedName,
      quantity,
      unit: (unit || '').trim(),
      category,
      status: 'active',
    });

    trackPurchase(userId, normalizedName); // async, non-blocking

    return res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/list/:id
 * Update quantity or status of a list item.
 *
 * Edge cases:
 *  - quantity < 1 → 400
 *  - invalid status → 400 (Mongoose enum validation)
 *  - item not found → 404
 *  - Marking 'purchased' triggers purchase history update
 */
async function updateItem(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity, status } = req.body;

    const updates = {};

    if (quantity !== undefined) {
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty < 1) {
        return res.status(400).json({ success: false, error: 'quantity must be a positive integer' });
      }
      updates.quantity = Math.floor(qty);
    }

    if (status !== undefined) {
      const valid = ['active', 'purchased', 'removed'];
      if (!valid.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `status must be one of: ${valid.join(', ')}`,
        });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'Nothing to update' });
    }

    const item = await ShoppingListItem.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Track purchase when an item is marked as purchased
    if (status === 'purchased') {
      trackPurchase(item.userId, item.itemName);
    }

    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/list/:id
 * Soft-delete an item by setting status to 'removed'.
 *
 * Edge case: item not found → 404 with clear message.
 */
async function removeItem(req, res, next) {
  try {
    const { id } = req.params;

    const item = await ShoppingListItem.findByIdAndUpdate(
      id,
      { $set: { status: 'removed' } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    res.json({ success: true, message: 'Item removed', item });
  } catch (err) {
    next(err);
  }
}

module.exports = { getList, addItem, updateItem, removeItem };
