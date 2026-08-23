const mongoose = require('mongoose');

/**
 * PurchaseHistory — Tracks how often a user buys/adds each item.
 * Used by the Smart Suggestions engine (Phase 3) to detect
 * "running low" items (frequency >= 3, not currently on list).
 */
const purchaseHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'userId is required'],
    index: true,
  },
  itemName: {
    type: String,
    required: [true, 'itemName is required'],
    trim: true,
    lowercase: true,
  },
  // How many times this item has been added/purchased
  frequency: {
    type: Number,
    default: 1,
    min: [1, 'Frequency must be at least 1'],
  },
  lastPurchasedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: one record per user-item pair
purchaseHistorySchema.index({ userId: 1, itemName: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseHistory', purchaseHistorySchema);
