/**
 * SuggestionPanel.jsx — ListEase Smart Recommendations Carousel
 *
 * Implements Spotify-style horizontal carousels with circular thumbnails,
 * quick-add interaction, categorized sections, and Framer Motion animations:
 *  - 🔄 Running Low (bought 3+ times, not on list)
 *  - 🌿 In Season Now (seasonal picks)
 *  - ⭐ Popular Picks (new user starters)
 *  - 🔁 Try Instead (catalog substitutes)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Star, Leaf, ArrowRightLeft } from 'lucide-react';
import { fetchSuggestions } from '../api/apiClient';
import TiltCard from './TiltCard';

const EMOJI_MAP = {
  milk: '🥛',
  eggs: '🥚',
  bread: '🍞',
  rice: '🍚',
  onion: '🧅',
  tomato: '🍅',
  potato: '🥔',
  banana: '🍌',
  dal: '🫘',
  tea: '🍵',
  coffee: '☕',
  apple: '🍎',
  spinach: '🥬',
  carrot: '🥕',
  peas: '🫛',
  mango: '🥭',
  chips: '🥔',
  water: '💧',
  ghee: '🧈',
  curd: '🥣',
};

export default function SuggestionPanel({ userId, onAddItem, listItems = [] }) {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const debounceRef                   = useRef(null);
  const listLengthRef                 = useRef(listItems.length);

  const activeNames = new Set((listItems || []).map(i => i.itemName?.toLowerCase()));

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!userId) return;
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await fetchSuggestions(userId);
      setData(result);
    } catch {
      // Non-critical: fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh when list changes (debounced)
  useEffect(() => {
    if (listItems.length === listLengthRef.current) return;
    listLengthRef.current = listItems.length;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load({ silent: true }), 800);
    return () => clearTimeout(debounceRef.current);
  }, [listItems.length, load]);

  const dedup = (arr, key = 'item') =>
    (arr || []).filter(s => s[key] && !activeNames.has(s[key].toLowerCase()));

  const runningLow  = dedup(data?.runningLow);
  const seasonal    = dedup(data?.seasonal);
  const popular     = dedup(data?.popular);
  const substitutes = dedup(data?.substitutes);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--clr-text-dim)' }}>
        Loading smart recommendations...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* 1. Running Low Section */}
      {runningLow.length > 0 && (
        <section className="carousel-section">
          <div className="list-section-header">
            <h3 className="carousel-title">
              <History size={20} color="var(--clr-primary)" />
              Running Low
            </h3>
          </div>
          <div className="carousel-scroll">
            {runningLow.map(item => (
              <CarouselCard
                key={item.item}
                title={item.item}
                subtitle={`Bought ${item.frequency}× before`}
                onAdd={() => onAddItem(item.item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 2. Popular Picks (New User Starter) */}
      {popular.length > 0 && (
        <section className="carousel-section">
          <div className="list-section-header">
            <h3 className="carousel-title">
              <Star size={20} color="var(--clr-primary)" fill="currentColor" />
              Popular Essentials
            </h3>
          </div>
          <div className="carousel-scroll">
            {popular.map(item => (
              <CarouselCard
                key={item.item}
                title={item.item}
                subtitle={item.reason || 'Pantry staple'}
                onAdd={() => onAddItem(item.item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. In Season Now */}
      {seasonal.length > 0 && (
        <section className="carousel-section">
          <div className="list-section-header">
            <h3 className="carousel-title">
              <Leaf size={20} color="var(--clr-secondary)" fill="currentColor" />
              In Season Now
            </h3>
          </div>
          <div className="carousel-scroll">
            {seasonal.map(item => (
              <CarouselCard
                key={item.item}
                title={item.item}
                subtitle={item.reason || 'Fresh this month'}
                onAdd={() => onAddItem(item.item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Substitutes */}
      {substitutes.length > 0 && (
        <section className="carousel-section">
          <div className="list-section-header">
            <h3 className="carousel-title">
              <ArrowRightLeft size={20} color="var(--clr-tertiary)" />
              Try Instead
            </h3>
          </div>
          <div className="carousel-scroll">
            {substitutes.map(item => (
              <CarouselCard
                key={item.item}
                title={item.item}
                subtitle={`Alternative for ${item.forItem}`}
                onAdd={() => onAddItem(item.item)}
              />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function CarouselCard({ title, subtitle, onAdd }) {
  const emoji = EMOJI_MAP[title.toLowerCase()] || '🛒';

  return (
    <TiltCard
      maxTilt={8}
      glare
      className="carousel-card"
      onClick={onAdd}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onAdd()}
      title={`Add ${title} to list`}
    >
      <div className="carousel-avatar" style={{ zIndex: 2 }}>
        {emoji}
      </div>
      <p className="carousel-item-name" style={{ zIndex: 2 }}>{title}</p>
      <p className="carousel-item-sub" style={{ zIndex: 2 }}>{subtitle}</p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        type="button"
        className="add-catalog-btn"
        style={{ marginTop: 'auto', paddingTop: 3, paddingBottom: 3, zIndex: 2 }}
        onClick={e => { e.stopPropagation(); onAdd(); }}
      >
        + Add
      </motion.button>
    </TiltCard>
  );
}
