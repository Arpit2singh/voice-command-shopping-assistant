require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const listRoutes        = require('./routes/list');
const searchRoutes      = require('./routes/search');
const suggestionsRoutes = require('./routes/suggestions');
const nlpRoutes         = require('./routes/nlp');
const errorHandler      = require('./middleware/errorHandler');

const app = express();

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/list',        listRoutes);
app.use('/api/search',      searchRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/nlp',         nlpRoutes);

// ─── 404 Catch-all ───────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ─── Centralized Error Handler ───────────────────────────────────────────────
app.use(errorHandler);

// ─── MongoDB + Server Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌  MONGO_URI is not set. Check your Backend/.env file.');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });

// ─── Handle unhandled rejections gracefully ───────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
