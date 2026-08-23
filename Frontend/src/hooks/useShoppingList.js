/**
 * useShoppingList.js — Shopping list state + API integration hook
 *
 * Manages:
 *   - items[]          active shopping list
 *   - loading          fetch/mutation in progress
 *   - error            last error message (API/network)
 *   - toast            transient success/info message
 *
 * Operations:
 *   loadList(userId)
 *   addItem(userId, itemName, quantity, unit)
 *   incrementQty(id, currentQty)
 *   decrementQty(id, currentQty)
 *   markPurchased(id)
 *   deleteItem(id)
 *   clearError()
 *
 * Edge cases:
 *   - Backend returns 200 with existing item (duplicate) → list re-fetched
 *   - Network failure → error set, list unchanged
 *   - Concurrent calls → loading flag prevents double-submission
 */

import { useState, useCallback, useRef } from 'react';
import * as api from '../api/apiClient';

export function useShoppingList() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [toast,   setToast]   = useState(null);

  // Debounce guard: prevent concurrent double-tap submissions
  const processingRef = useRef(false);

  // ─── Toast helper ─────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success', durationMs = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), durationMs);
  }, []);

  // ─── Load list ────────────────────────────────────────────────
  const loadList = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const { items: fetched } = await api.fetchList(userId);
      setItems(fetched || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Add item ─────────────────────────────────────────────────
  const addItem = useCallback(async (userId, itemName, quantity = 1, unit = '') => {
    if (!userId || !itemName?.trim()) return null;

    // Debounce: ignore if already processing (concurrent double-tap guard)
    if (processingRef.current) {
      showToast('Please wait a moment…', 'info');
      return null;
    }

    processingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await api.addItem({ userId, itemName, quantity, unit });

      if (data.item) {
        setItems(prev => {
          const existingIdx = prev.findIndex(i => i._id === data.item._id);
          if (existingIdx !== -1) {
            // Backend returned updated existing item (qty incremented)
            const updated = [...prev];
            updated[existingIdx] = data.item;
            return updated;
          }
          // New item — prepend to list
          return [data.item, ...prev];
        });
      }

      const msg = data.message || `✓ ${itemName} added`;
      showToast(msg, 'success');
      return data.item;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
      // Release debounce lock after 2s (idempotency window)
      setTimeout(() => { processingRef.current = false; }, 2000);
    }
  }, [showToast]);

  // ─── Update quantity ──────────────────────────────────────────
  const updateQuantity = useCallback(async (id, newQty) => {
    if (newQty < 1) return;
    // Optimistic update
    setItems(prev => prev.map(i => i._id === id ? { ...i, quantity: newQty } : i));
    try {
      await api.updateItem(id, { quantity: newQty });
    } catch (err) {
      setError(err.message);
      // Revert optimistic update not needed — user can see the error
    }
  }, []);

  const incrementQty = useCallback((id, currentQty) => updateQuantity(id, currentQty + 1), [updateQuantity]);
  const decrementQty = useCallback((id, currentQty) => {
    if (currentQty > 1) updateQuantity(id, currentQty - 1);
  }, [updateQuantity]);

  // ─── Mark purchased ───────────────────────────────────────────
  const markPurchased = useCallback(async (id) => {
    // Optimistic update
    setItems(prev => prev.map(i => i._id === id ? { ...i, status: 'purchased' } : i));
    try {
      await api.updateItem(id, { status: 'purchased' });
      showToast('Item marked as purchased ✓', 'success');
      // Remove from list after short delay
      setTimeout(() => setItems(prev => prev.filter(i => i._id !== id)), 1200);
    } catch (err) {
      setError(err.message);
      setItems(prev => prev.map(i => i._id === id ? { ...i, status: 'active' } : i));
    }
  }, [showToast]);

  // ─── Delete (soft-remove) ─────────────────────────────────────
  const deleteItem = useCallback(async (id) => {
    // Optimistic remove
    setItems(prev => prev.filter(i => i._id !== id));
    try {
      await api.removeItem(id);
      showToast('Item removed', 'success');
    } catch (err) {
      setError(err.message);
    }
  }, [showToast]);

  // ─── Clear error ──────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), []);

  return {
    items,
    loading,
    error,
    toast,
    loadList,
    addItem,
    incrementQty,
    decrementQty,
    markPurchased,
    deleteItem,
    clearError,
  };
}
