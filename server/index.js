import express from 'express';
import cors from 'cors';
import { initDatabase } from './db.js';
import authRouter from './routes/auth.js';
import workoutsRouter from './routes/workouts.js';
import plansRouter from './routes/plans.js';
import nutritionRouter from './routes/nutrition.js';
import telemetryRouter from './routes/telemetry.js';
import syncRouter from './routes/sync.js';
import { authenticateToken } from './middleware/auth.js';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Normalized Database Schema & Migrations
initDatabase();

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Anchor Fitness OS Backend Engine',
    version: '2.0.0-normalized',
    time: Date.now()
  });
});

// Mount Modular API Routes
app.use('/api/auth', authRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/plans', plansRouter);
app.use('/api/nutrition', nutritionRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/sync', syncRouter);

// Backward Compatibility: /api/user/sync endpoints for existing clients
app.get('/api/user/sync', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT data_payload, updated_at FROM user_data WHERE user_id = ?');
    const row = stmt.get(req.user.userId);

    if (!row || !row.data_payload) {
      return res.json({ data: null, updatedAt: null });
    }

    const data = JSON.parse(row.data_payload);
    res.json({ data, updatedAt: row.updated_at });
  } catch (err) {
    console.error('[Legacy Sync GET Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve cloud sync payload' });
  }
});

app.post('/api/user/sync', authenticateToken, (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'No data payload provided' });

    const payloadStr = JSON.stringify(data);
    const now = Date.now();

    db.prepare(`
      INSERT INTO user_data (user_id, data_payload, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        data_payload = excluded.data_payload,
        updated_at = excluded.updated_at
    `).run(req.user.userId, payloadStr, now);

    res.json({ success: true, updatedAt: now });
  } catch (err) {
    console.error('[Legacy Sync POST Error]:', err);
    res.status(500).json({ error: 'Failed to record cloud sync payload' });
  }
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Anchor Backend Unhandled Error]:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`[Anchor Backend] Modular OS Engine running on http://localhost:${PORT}`);
});
