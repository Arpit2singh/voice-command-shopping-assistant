/**
 * SearchBar.jsx — Catalog search with voice + text input & multi-parameter filtering (Phase 4)
 *
 * Features:
 *   - Text search with live debounced catalog results dropdown
 *   - Voice search: parses transcript via searchParser → extracts query, price ceiling, min price, brand, category, sort
 *   - Voice search detection badge showing parsed filters
 *   - Expandable filter drawer:
 *       • Category select (dynamically loaded from /api/search/categories)
 *       • Max Price filter (under ₹X)
 *       • Min Price filter (above ₹Y)
 *       • Brand / Quality qualifier
 *       • Sort dropdown (Cheapest, Most expensive, Name A-Z)
 *   - Active filter pills with one-click clear
 *   - "+ Add" button on each result → directly adds to shopping list
 *   - Clear button when query is non-empty
 *
 * Edge cases handled (Phase 4):
 *   - No search results → graceful "No matches found" message with tips
 *   - Invalid price ("under abc") → ignored by parser & backend
 *   - Regex injection characters → sanitized & escaped
 *   - Keyboard accessible (Enter to add/search, Escape to close)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchCatalog, fetchCategories } from '../api/apiClient';
import { parseSearchQuery, describeFilters } from '../utils/searchParser';

export default function SearchBar({
  userId,
  onAddFromSearch,
  voiceTranscript,
  onVoiceSearchConsumed,
}) {
  const [query, setQuery]               = useState('');
  const [category, setCategory]         = useState('');
  const [maxPrice, setMaxPrice]         = useState('');
  const [minPrice, setMinPrice]         = useState('');
  const [brand, setBrand]               = useState('');
  const [sortBy, setSortBy]             = useState('');
  const [showFilters, setShowFilters]   = useState(false);
  const [categories, setCategories]     = useState([]);
  const [voiceBadge, setVoiceBadge]     = useState(null);

  const [results, setResults]           = useState([]);
  const [open, setOpen]                 = useState(false);
  const [loading, setLoading]           = useState(false);

  const inputRef      = useRef(null);
  const debounceRef   = useRef(null);
  const wrapperRef    = useRef(null);

  // ── Load available categories on mount ──────────────────────
  useEffect(() => {
    let isMounted = true;
    fetchCategories()
      .then(data => {
        if (isMounted && data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {
        // Fallback default category list if DB empty/offline
        setCategories(['dairy', 'produce', 'snacks', 'beverages', 'grains', 'pulses', 'spices', 'condiments', 'meat', 'household']);
      });
    return () => { isMounted = false; };
  }, []);

  // ── Search execution function ───────────────────────────────
  const doSearch = useCallback(async (filters = {}) => {
    const q       = filters.q !== undefined ? filters.q : query;
    const cat     = filters.category !== undefined ? filters.category : category;
    const maxP    = filters.maxPrice !== undefined ? filters.maxPrice : (maxPrice ? Number(maxPrice) : null);
    const minP    = filters.minPrice !== undefined ? filters.minPrice : (minPrice ? Number(minPrice) : null);
    const brnd    = filters.brand !== undefined ? filters.brand : brand;
    const sort    = filters.sortBy !== undefined ? filters.sortBy : sortBy;

    // If everything is empty, close results
    if (!q.trim() && !cat && maxP === null && minP === null && !brnd) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const data = await searchCatalog({
        q: q.trim(),
        category: cat || null,
        maxPrice: maxP,
        minPrice: minP,
        brand: brnd || null,
        sortBy: sort || null,
      });
      setResults(data.results || []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, category, maxPrice, minPrice, brand, sortBy]);

  // ── Handle incoming voice search transcript ───────────────────
  useEffect(() => {
    if (voiceTranscript) {
      const parsed = parseSearchQuery(voiceTranscript);
      const newQuery = parsed.query || '';
      setQuery(newQuery);

      if (parsed.category) setCategory(parsed.category);
      if (parsed.maxPrice !== null) setMaxPrice(String(parsed.maxPrice));
      if (parsed.minPrice !== null) setMinPrice(String(parsed.minPrice));
      if (parsed.brand) setBrand(parsed.brand);
      if (parsed.sortBy) setSortBy(parsed.sortBy);

      const description = describeFilters(parsed);
      if (description) {
        setVoiceBadge(description);
        setTimeout(() => setVoiceBadge(null), 6000);
      }

      doSearch({
        q: newQuery,
        category: parsed.category || category,
        maxPrice: parsed.maxPrice,
        minPrice: parsed.minPrice,
        brand: parsed.brand || brand,
        sortBy: parsed.sortBy || sortBy,
      });

      onVoiceSearchConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceTranscript]);

  // ── Debounce user typing & filter adjustments ─────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() && !category && !maxPrice && !minPrice && !brand) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      doSearch();
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [query, category, maxPrice, minPrice, brand, sortBy, doSearch]);

  // ── Outside click to close results dropdown ───────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    doSearch();
  };

  const handleAdd = (item) => {
    onAddFromSearch?.(item.name);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const clearAllFilters = () => {
    setCategory('');
    setMaxPrice('');
    setMinPrice('');
    setBrand('');
    setSortBy('');
    setVoiceBadge(null);
  };

  const hasActiveFilters = Boolean(category || maxPrice || minPrice || brand || sortBy);

  return (
    <div className="search-bar" ref={wrapperRef}>
      {/* Main search input bar */}
      <form onSubmit={handleSubmit} className="search-input-box">
        <span className="search-icon" aria-hidden="true" style={{ opacity: 0.7, marginRight: '4px' }}>🔍</span>
        <input
          ref={inputRef}
          id="search-input"
          className="search-input"
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => (results.length > 0 || query.trim()) && setOpen(true)}
          placeholder="Search items (e.g., 'milk', 'apples under 50', 'organic')..."
          aria-label="Search catalog"
          aria-autocomplete="list"
          aria-expanded={open}
          autoComplete="off"
        />
        <div className="search-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={handleClear}
              aria-label="Clear search"
              title="Clear input"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="search-btn"
            disabled={(!query.trim() && !hasActiveFilters) || loading}
          >
            {loading ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> : 'Search'}
          </button>
        </div>
      </form>

      {/* Voice filter detected badge */}
      {voiceBadge && (
        <div className="voice-filter-badge" aria-live="polite">
          <span>🎙️ Voice filter applied:</span>
          <strong>{voiceBadge}</strong>
        </div>
      )}

      {/* Filter toggle and active pills bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          className={`filter-drawer-btn${showFilters || hasActiveFilters ? ' active' : ''}`}
          onClick={() => setShowFilters(prev => !prev)}
          aria-expanded={showFilters}
        >
          <span>⚙️ Filters</span>
          {hasActiveFilters && <span style={{ background: 'var(--clr-accent)', color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>•</span>}
          <span>{showFilters ? '▲' : '▼'}</span>
        </button>

        {/* Active filter summary pills */}
        {hasActiveFilters && (
          <div className="filter-pills-row">
            {category && (
              <span className="active-pill">
                Category: {category}
                <button type="button" className="pill-remove" onClick={() => setCategory('')} title="Remove category filter">✕</button>
              </span>
            )}
            {maxPrice && (
              <span className="active-pill">
                Max: ₹{maxPrice}
                <button type="button" className="pill-remove" onClick={() => setMaxPrice('')} title="Remove max price filter">✕</button>
              </span>
            )}
            {minPrice && (
              <span className="active-pill">
                Min: ₹{minPrice}
                <button type="button" className="pill-remove" onClick={() => setMinPrice('')} title="Remove min price filter">✕</button>
              </span>
            )}
            {brand && (
              <span className="active-pill">
                Brand: {brand}
                <button type="button" className="pill-remove" onClick={() => setBrand('')} title="Remove brand filter">✕</button>
              </span>
            )}
            {sortBy && (
              <span className="active-pill">
                Sort: {sortBy === 'price_asc' ? 'Cheapest' : sortBy === 'price_desc' ? 'Price High' : 'A-Z'}
                <button type="button" className="pill-remove" onClick={() => setSortBy('')} title="Remove sort">✕</button>
              </span>
            )}
            <button
              type="button"
              className="pill-remove"
              style={{ fontSize: '0.72rem', textDecoration: 'underline', color: 'var(--clr-danger)' }}
              onClick={clearAllFilters}
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Expandable filter drawer */}
      {showFilters && (
        <div className="filter-grid" role="region" aria-label="Search filter options">
          {/* Category */}
          <div className="filter-group">
            <label htmlFor="filter-cat" className="filter-title">Category</label>
            <select
              id="filter-cat"
              className="filter-control"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Max Price */}
          <div className="filter-group">
            <label htmlFor="filter-maxprice" className="filter-title">Max Price (₹)</label>
            <input
              id="filter-maxprice"
              type="number"
              min="0"
              className="filter-control"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="e.g. 100"
            />
          </div>

          {/* Min Price */}
          <div className="filter-group">
            <label htmlFor="filter-minprice" className="filter-title">Min Price (₹)</label>
            <input
              id="filter-minprice"
              type="number"
              min="0"
              className="filter-control"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="e.g. 20"
            />
          </div>

          {/* Brand/Type */}
          <div className="filter-group">
            <label htmlFor="filter-brand" className="filter-title">Brand / Type</label>
            <input
              id="filter-brand"
              type="text"
              className="filter-control"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="e.g. organic, fresh"
            />
          </div>

          {/* Sort order */}
          <div className="filter-group">
            <label htmlFor="filter-sort" className="filter-title">Sort By</label>
            <select
              id="filter-sort"
              className="filter-control"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="">Default (Name)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Dropdown */}
      {open && results.length > 0 && (
        <div className="search-dropdown" role="listbox" aria-label="Search results">
          <div className="search-item-title" style={{ padding: '8px 16px', color: 'var(--clr-text-muted)' }}>
            Found {results.length} catalog item{results.length > 1 ? 's' : ''}
          </div>
          {results.map(item => (
            <div
              key={item._id || item.name}
              className="search-item-row"
              role="option"
              onClick={() => handleAdd(item)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleAdd(item)}
            >
              <div className="search-result-meta" style={{ flex: 1, minWidth: 0 }}>
                <span className="search-item-title">{item.name}</span>
                {item.brand && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', marginLeft: 6 }}>
                    ({item.brand})
                  </span>
                )}
                {item.category && (
                  <span className="search-item-badge" style={{ marginLeft: 8 }}>
                    {item.category}
                  </span>
                )}
              </div>
              <div className="search-result-meta">
                {item.price != null && (
                  <span className="search-result-price" style={{ marginRight: '16px' }}>₹{item.price}</span>
                )}
                <button
                  type="button"
                  className="add-catalog-btn"
                  onClick={e => {
                    e.stopPropagation();
                    handleAdd(item);
                  }}
                >
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Results state */}
      {open && !loading && results.length === 0 && (query.trim() || hasActiveFilters) && (
        <div className="search-dropdown" role="status">
          <div className="search-item-row" style={{ flexDirection: 'column', alignItems: 'center', gap: 6, padding: '1rem', color: 'var(--clr-text-3)', textAlign: 'center' }}>
            <span>🔍 No matches found for current search & filters.</span>
            <span style={{ fontSize: '0.75rem' }}>Try clearing filters or searching for general grocery terms like "milk", "apple", or "rice".</span>
          </div>
        </div>
      )}
    </div>
  );
}
