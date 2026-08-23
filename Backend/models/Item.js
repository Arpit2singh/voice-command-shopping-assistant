const mongoose = require('mongoose');

/**
 * Item — Master Catalog
 * Stores canonical items with aliases for multilingual matching,
 * seasonal availability, and substitutes.
 */
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  },
  // e.g. ['milk', 'doodh', 'dudh'] — for multilingual matching
  aliases: {
    type: [String],
    default: [],
  },
  // e.g. 'dairy', 'produce', 'snacks', 'beverages', 'uncategorized'
  category: {
    type: String,
    default: 'uncategorized',
    trim: true,
    lowercase: true,
  },
  brand: {
    type: String,
    trim: true,
    default: '',
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: null,
  },
  // months when this item is in season (0 = Jan, 11 = Dec), or [] for year-round
  season: {
    type: [String],
    default: [],
  },
  // canonical names of substitute items
  substitutes: {
    type: [String],
    default: [],
  },
});

// Text index for efficient full-text search
itemSchema.index({ name: 'text', aliases: 'text', brand: 'text' });

module.exports = mongoose.model('Item', itemSchema);
