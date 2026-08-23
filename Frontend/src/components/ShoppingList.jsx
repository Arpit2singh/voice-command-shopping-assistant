/**
 * ShoppingList.jsx — ListEase Active Shopping List
 *
 * Bento-grid cards with category indicator, stepper quantity selector,
 * checkbox toggle, in-list category filter pills, and smooth Framer Motion animations.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus, Plus, Trash2 } from 'lucide-react';
import EmptyState from './EmptyState';
import TiltCard from './TiltCard';

const CATEGORY_COLORS = {
  dairy:      '#38bdf8', // sky blue
  produce:    '#a78bfa', // electric lavender
  snacks:     '#f472b6', // neon rose
  beverages:  '#818cf8', // indigo
  grains:     '#fbbf24', // warm amber
  pulses:     '#c084fc', // radiant violet
  meat:       '#fb7185', // coral red
  household:  '#67e8f9', // soft cyan
  spices:     '#fde047', // golden yellow
  condiments: '#fb923c', // warm tangerine
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export default function ShoppingList({
  items = [],
  loading,
  onIncrement,
  onDecrement,
  onMarkPurchased,
  onDelete,
  isSupported,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery]           = useState('');

  const activeItems    = useMemo(() => items.filter(i => i.status === 'active'), [items]);
  const purchasedItems = useMemo(() => items.filter(i => i.status === 'purchased'), [items]);

  // Extract distinct categories from active items
  const availableCategories = useMemo(() => {
    const cats = new Set(activeItems.map(i => i.category || 'uncategorized'));
    return Array.from(cats);
  }, [activeItems]);

  // Filter items
  const filteredActiveItems = useMemo(() => {
    return activeItems.filter(item => {
      const matchCat = selectedCategory === 'all' || (item.category || 'uncategorized') === selectedCategory;
      const matchQuery = !searchQuery.trim() || item.itemName.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCat && matchQuery;
    });
  }, [activeItems, selectedCategory, searchQuery]);

  if (!loading && items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <EmptyState isSupported={isSupported} />
      </motion.div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header with count badge */}
      <div className="list-section-header">
        <h3 className="font-headline-sm">
          Current List ({activeItems.length})
        </h3>
        {activeItems.length > 0 && selectedCategory !== 'all' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="font-label-caps"
            style={{ color: 'var(--clr-primary)', cursor: 'pointer' }}
            onClick={() => setSelectedCategory('all')}
          >
            Show All
          </motion.button>
        )}
      </div>

      {/* In-List Category Filter Pills */}
      {availableCategories.length > 1 && (
        <div className="inlist-filter-bar" role="toolbar" aria-label="Filter active items by category">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            className={`cat-pill${selectedCategory === 'all' ? ' active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All ({activeItems.length})
          </motion.button>
          {availableCategories.map(cat => {
            const count = activeItems.filter(i => (i.category || 'uncategorized') === cat).length;
            return (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                className={`cat-pill${selectedCategory === cat ? ' active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} ({count})
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Active Items Bento Grid with Fluid Motion Layout */}
      {filteredActiveItems.length > 0 ? (
        <motion.div
          className="list-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredActiveItems.map(item => (
              <motion.div
                key={item._id}
                layout
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <ItemCard
                  item={item}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                  onMarkPurchased={onMarkPurchased}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : activeItems.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--clr-text-dim)' }}
        >
          No items in category "{selectedCategory}".
        </motion.div>
      ) : null}

      {/* Purchased / Completed Items */}
      {purchasedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginTop: 'var(--space-xl)' }}
        >
          <div className="list-section-header">
            <h3 className="font-headline-sm" style={{ color: 'var(--clr-text-dim)', fontSize: '1rem' }}>
              ✓ Completed ({purchasedItems.length})
            </h3>
          </div>
          <motion.div
            className="list-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            layout
          >
            <AnimatePresence mode="popLayout">
              {purchasedItems.map(item => (
                <motion.div
                  key={item._id}
                  layout
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <ItemCard
                    item={item}
                    onIncrement={onIncrement}
                    onDecrement={onDecrement}
                    onMarkPurchased={onMarkPurchased}
                    onDelete={onDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function ItemCard({ item, onIncrement, onDecrement, onMarkPurchased, onDelete }) {
  const isPurchased = item.status === 'purchased';
  const catColor = CATEGORY_COLORS[item.category] || 'var(--clr-text-dim)';

  return (
    <TiltCard maxTilt={6} glare={!isPurchased} className={`list-card${isPurchased ? ' purchased' : ''}`}>
      {/* Left side: Checkbox & Item details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, minWidth: 0, zIndex: 2 }}>
        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          className={`check-btn${isPurchased ? ' checked' : ''}`}
          onClick={() => onMarkPurchased(item._id)}
          aria-label={isPurchased ? 'Mark as active' : 'Mark as purchased'}
          title={isPurchased ? 'Mark active' : 'Mark purchased'}
        >
          <Check size={16} />
        </motion.button>

        <div style={{ minWidth: 0 }}>
          <p className="item-name">{item.itemName}</p>
          <div className="item-category-tag">
            <span className="category-dot" style={{ backgroundColor: catColor }} />
            <span>{item.category || 'uncategorized'}{item.unit ? ` · ${item.unit}` : ''}</span>
          </div>
        </div>
      </div>

      {/* Right side: Stepper quantity & Delete action */}
      <div className="card-actions" style={{ zIndex: 2 }}>
        {!isPurchased && (
          <div className="stepper-widget" aria-label="Adjust quantity">
            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              className="stepper-btn"
              onClick={() => onDecrement(item._id, item.quantity)}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </motion.button>
            <span className="stepper-val">{item.quantity}</span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              className="stepper-btn"
              onClick={() => onIncrement(item._id, item.quantity)}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </motion.button>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.1, color: '#fb7185' }}
          whileTap={{ scale: 0.9 }}
          type="button"
          className="delete-btn"
          onClick={() => onDelete(item._id)}
          aria-label={`Remove ${item.itemName} from list`}
          title="Remove"
        >
          <Trash2 size={18} />
        </motion.button>
      </div>
    </TiltCard>
  );
}
