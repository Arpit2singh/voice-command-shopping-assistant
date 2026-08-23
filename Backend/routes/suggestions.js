const express = require('express');
const router  = express.Router();
const { getSuggestionsHandler } = require('../controllers/suggestionsController');

/**
 * Suggestions Routes (Phase 3)
 *
 * GET /api/suggestions/:userId
 *   Returns: { runningLow, seasonal, popular, substitutes, isNewUser }
 */
router.get('/:userId', getSuggestionsHandler);

module.exports = router;
