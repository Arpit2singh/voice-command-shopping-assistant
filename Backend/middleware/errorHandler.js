/**
 * errorHandler.js — Centralized Express error middleware
 *
 * Must be registered LAST (after all routes) in server.js.
 * Always returns a consistent JSON shape so the frontend
 * can rely on { success: false, error: "..." } in all error cases.
 *
 * Edge cases handled:
 *  - Mongoose ValidationError → 400 with field-level messages
 *  - Mongoose CastError (bad ObjectId) → 400
 *  - Mongoose duplicate key error (code 11000) → 409
 *  - Generic server errors → 500
 *  - Never crashes the server; never leaks stack traces in production
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';

  // Log full error in development
  if (!isProd) {
    console.error('[Error Handler]', err);
  }

  // ── Mongoose Validation Error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: messages,
    });
  }

  // ── Mongoose Cast Error (e.g. bad ObjectId in URL) ────────────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid value for field '${err.path}'`,
    });
  }

  // ── MongoDB Duplicate Key ─────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `Duplicate value for '${field}'`,
    });
  }

  // ── CORS Error ────────────────────────────────────────────────────────────
  if (err.message && err.message.includes('Not allowed by CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS: origin not allowed',
    });
  }

  // ── Generic / Unexpected Error ────────────────────────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack }),
  });
}

module.exports = errorHandler;
