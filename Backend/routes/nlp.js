const express = require('express');
const router = express.Router();
const nlpController = require('../controllers/nlpController');

// POST /api/nlp/parse - Parse transcript into structured intent using Groq LLM
router.post('/parse', nlpController.parseIntent);

module.exports = router;
