import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDatabase, db } from './db.js';
import authRouter from './routes/auth.js';
import workoutsRouter from './routes/workouts.js';
import plansRouter from './routes/plans.js';
import nutritionRouter from './routes/nutrition.js';
import telemetryRouter from './routes/telemetry.js';
import syncRouter from './routes/sync.js';
import { authenticateToken } from './middleware/auth.js';
import { authRateLimiter, syncRateLimiter, generalRateLimiter } from './middleware/rateLimiter.js';
import { securityHeaders } from './securityHeaders.js';

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 5001;

// Global Middleware
app.use(securityHeaders);
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl) or matching dev/prod origins
    if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev, or specify strict origins
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Initialize Normalized Database Schema & Migrations
initDatabase();

// Comprehensive Health & Diagnostics Check
app.get('/api/health', (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const testQuery = db.prepare('SELECT 1 as test').get();
    if (testQuery && testQuery.test === 1) {
      dbStatus = 'healthy (WAL mode)';
    }
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  const memory = process.memoryUsage();

  res.json({
    status: dbStatus.startsWith('healthy') ? 'ok' : 'degraded',
    service: 'Anchor Fitness OS Backend Engine',
    version: '2.1.0-production-hardened',
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMb: (memory.rss / 1024 / 1024).toFixed(1),
      heapUsedMb: (memory.heapUsed / 1024 / 1024).toFixed(1)
    },
    timestamp: Date.now()
  });
});

// Mount Rate-Limited Modular API Routes
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/sync', syncRateLimiter, syncRouter);
app.use('/api/workouts', generalRateLimiter, workoutsRouter);
app.use('/api/plans', generalRateLimiter, plansRouter);
app.use('/api/nutrition', generalRateLimiter, nutritionRouter);
app.use('/api/telemetry', generalRateLimiter, telemetryRouter);

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

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBackup } from './backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Admin Hot Backup Trigger Endpoint
app.post('/api/admin/backup', authenticateToken, (req, res) => {
  const result = createBackup();
  if (result.success) res.json(result);
  else res.status(500).json(result);
});

// Production Static File Serving (Single Container Deployment)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

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
