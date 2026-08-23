const mongoose = require('mongoose');

/**
 * ShoppingListItem — Active shopping list entries per user.
 * Status lifecycle: active → purchased | removed
 */
const shoppingListItemSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    default: 1,
    min: [1, 'Quantity must be at least 1'],
  },
  // e.g. 'bottles', 'kg', 'pcs', 'dozen'
  unit: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    trim: true,
    lowercase: true,
    default: 'uncategorized',
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'purchased', 'removed'],
      message: 'Status must be active, purchased, or removed',
    },
    default: 'active',
    index: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index: userId + status — most common query pattern
shoppingListItemSchema.index({ userId: 1, status: 1 });

// Compound index for idempotency checks (dedup within same user + item + status)
shoppingListItemSchema.index({ userId: 1, itemName: 1, status: 1 });

module.exports = mongoose.model('ShoppingListItem', shoppingListItemSchema);
