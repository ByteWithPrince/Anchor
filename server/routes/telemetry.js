import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Ingest GPS Route Breadcrumbs Stream
router.post('/gps', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      id,
      sessionId,
      coordinates = [],
      distanceKm = 0,
      durationSec = 0,
      paceMinKm = 0
    } = req.body;

    const streamId = id || `gps_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();

    const payloadJson = JSON.stringify({
      coordinates,
      distanceKm,
      durationSec,
      paceMinKm,
      recordedAt: now
    });

    db.prepare(`
      INSERT INTO telemetry_streams (
        id, user_id, session_id, stream_type, payload_json, distance_km, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        payload_json = excluded.payload_json,
        distance_km = excluded.distance_km,
        timestamp = excluded.timestamp
    `).run(streamId, userId, sessionId || null, 'gps', payloadJson, Number(distanceKm) || 0, now);

    res.status(201).json({ success: true, streamId });
  } catch (err) {
    console.error('[Telemetry GPS Ingest Error]:', err);
    res.status(500).json({ error: 'Failed to ingest GPS telemetry' });
  }
});

// 2. Retrieve GPS Route Breadcrumbs
router.get('/gps/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const streamId = req.params.id;

    const row = db.prepare(`
      SELECT * FROM telemetry_streams
      WHERE (id = ? OR session_id = ?) AND user_id = ? AND stream_type = 'gps'
      ORDER BY timestamp DESC LIMIT 1
    `).get(streamId, streamId, userId);

    if (!row) {
      return res.status(404).json({ error: 'GPS stream not found' });
    }

    let payload = {};
    try {
      payload = JSON.parse(row.payload_json);
    } catch {
      payload = {};
    }

    res.json({
      streamId: row.id,
      sessionId: row.session_id,
      distanceKm: row.distance_km,
      timestamp: row.timestamp,
      data: payload
    });
  } catch (err) {
    console.error('[Telemetry GPS GET Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve GPS stream' });
  }
});

// 3. Log Bodyweight Check-in
router.post('/bodyweight', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { id, date, weight } = req.body;

    if (!weight) {
      return res.status(400).json({ error: 'Weight measurement is required' });
    }

    const now = Date.now();
    const bwId = id || `bw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const logDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO bodyweight_logs (id, user_id, date, weight_kg, timestamp, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        weight_kg = excluded.weight_kg,
        date = excluded.date,
        updated_at = excluded.updated_at
    `).run(bwId, userId, logDate, Number(weight), now, now);

    res.status(201).json({
      success: true,
      log: {
        id: bwId,
        date: logDate,
        weight: Number(weight),
        timestamp: now
      }
    });
  } catch (err) {
    console.error('[Bodyweight Log Error]:', err);
    res.status(500).json({ error: 'Failed to record bodyweight measurement' });
  }
});

// 4. Retrieve Bodyweight Trend History
router.get('/bodyweight', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const rows = db.prepare(`
      SELECT * FROM bodyweight_logs
      WHERE user_id = ?
      ORDER BY date ASC
    `).all(userId);

    const history = rows.map(r => ({
      id: r.id,
      date: r.date,
      weight: r.weight_kg,
      timestamp: r.timestamp
    }));

    res.json({ history });
  } catch (err) {
    console.error('[Bodyweight History Error]:', err);
    res.status(500).json({ error: 'Failed to load bodyweight history' });
  }
});

export default router;
