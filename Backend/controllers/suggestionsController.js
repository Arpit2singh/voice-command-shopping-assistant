const { getSuggestions } = require('../utils/suggestions');

/**
 * GET /api/suggestions/:userId
 *
 * Returns all four suggestion buckets for a user:
 *   runningLow  — replenishment reminders
 *   seasonal    — in-season items
 *   popular     — curated defaults (new user fallback)
 *   substitutes — alternatives for items already on the list
 *
 * Phase 3 edge cases:
 *   - Missing userId     → 400
 *   - New user           → runningLow = [], popular shown instead
 *   - DB error           → 500 via centralized error handler
 */
async function getSuggestionsHandler(req, res, next) {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const suggestions = await getSuggestions(userId.trim());

    return res.json({
      success: true,
      isNewUser: suggestions.runningLow.length === 0,
      ...suggestions,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSuggestionsHandler };
