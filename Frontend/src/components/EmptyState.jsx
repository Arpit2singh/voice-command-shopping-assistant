/**
 * EmptyState.jsx — Empty shopping list illustration + prompt
 *
 * Shown when items[] is empty and not loading.
 *
 * Props:
 *   isSupported {bool} — adjusts prompt text for text-only vs voice mode
 */

import React from 'react';

export default function EmptyState({ isSupported = true }) {
  return (
    <div className="empty-state" aria-label="Empty shopping list">
      <div className="empty-illustration" aria-hidden="true">🛒</div>
      <h2 className="empty-title">Your list is empty</h2>
      <p className="empty-subtitle">
        {isSupported
          ? 'Tap the mic and say "Add milk" or "I need 2 kg apples" to get started.'
          : 'Type an item name below and press Enter to add it to your list.'}
      </p>
    </div>
  );
}
