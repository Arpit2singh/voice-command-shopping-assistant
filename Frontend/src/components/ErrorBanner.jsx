/**
 * ErrorBanner.jsx — Error display component
 *
 * Two variants:
 *   persistent (default) — stays until user dismisses (mic denied, network error)
 *   toast                — auto-dismissed by parent after timeout ('no-speech', etc.)
 *
 * Props:
 *   title       {string}
 *   message     {string}
 *   isToast     {bool}    — renders as a fixed toast overlay
 *   onDismiss   {fn}      — called when ✕ is clicked
 *
 * Phase 2 edge-case mapping:
 *   'not-allowed' → persistent banner ("Microphone access denied…")
 *   'no-speech'   → toast ("Didn't catch that, try again")
 *   network error → persistent banner
 */

import React from 'react';

const ERROR_MAP = {
  'not-allowed': {
    title: 'Microphone access denied',
    message: 'Please allow microphone access in your browser settings, or use the text input below.',
  },
  'no-speech': {
    title: "Didn't catch that",
    message: 'No speech was detected. Please try again.',
  },
  'audio-capture': {
    title: 'No microphone found',
    message: 'Ensure a microphone is connected and try again.',
  },
  'network': {
    title: 'Speech service unavailable',
    message: 'Check your internet connection and try again.',
  },
  'aborted': null, // User stopped voluntarily — no banner needed
};

export default function ErrorBanner({ title, message, errorCode, isToast = false, onDismiss }) {
  // Map known error codes to friendly messages
  const mapped = errorCode ? ERROR_MAP[errorCode] : null;
  if (errorCode && mapped === null) return null; // aborted — silent

  const displayTitle   = title   || mapped?.title   || 'Something went wrong';
  const displayMessage = message || mapped?.message || 'Please try again.';

  const className = `error-banner${isToast ? ' toast' : ''}`;

  return (
    <div className={className} role={isToast ? 'status' : 'alert'} aria-live="assertive">
      <span className="error-icon">{isToast ? '⚠️' : '🚫'}</span>
      <div className="error-body">
        <p className="error-title">{displayTitle}</p>
        <p className="error-message">{displayMessage}</p>
      </div>
      {onDismiss && (
        <button
          className="error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
