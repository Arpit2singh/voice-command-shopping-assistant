/**
 * ConfirmChip.jsx — Ambiguous intent confirmation (Phase 2 edge case)
 *
 * Shown when:
 *   - Voice transcript had no clear action verb (action = 'unknown')
 *   - Prompts: "Add [item]? ✓ ✗"
 *
 * Props:
 *   itemName    {string}
 *   action      {string}  — displayed action verb (default: 'add')
 *   onConfirm   {fn}
 *   onReject    {fn}
 */

import React from 'react';

export default function ConfirmChip({ itemName, action = 'add', onConfirm, onReject }) {
  if (!itemName) return null;

  const displayAction = action === 'unknown' ? 'add' : action;

  return (
    <div className="confirm-chip" role="alert" aria-live="polite">
      <span className="chip-label">
        {displayAction.charAt(0).toUpperCase() + displayAction.slice(1)}
        {' '}
        <span className="chip-item">"{itemName}"</span>?
      </span>
      <div className="chip-actions">
        <button
          id="confirm-btn"
          className="chip-btn confirm"
          onClick={onConfirm}
          aria-label={`Confirm ${displayAction} ${itemName}`}
          title="Confirm"
        >
          ✓
        </button>
        <button
          id="reject-btn"
          className="chip-btn reject"
          onClick={onReject}
          aria-label="Reject and dismiss"
          title="Dismiss"
        >
          ✗
        </button>
      </div>
    </div>
  );
}
