import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Get Logged Food Entries & Daily Aggregated Macros
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, startDate, endDate } = req.query;

    let query = `
      SELECT * FROM nutrition_logs
      WHERE user_id = ? AND deleted_at IS NULL
    `;
    const params = [userId];

    if (date) {
      query += ` AND date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY created_at DESC`;

    const rows = db.prepare(query).all(...params);

    const items = rows.map(r => ({
      id: r.id,
      name: r.food_name,
      date: r.date,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      mealType: r.meal_type,
      source: r.source,
      timestamp: r.created_at
    }));

    // Aggregations
    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + (Number(item.calories) || 0),
        protein: acc.protein + (Number(item.protein) || 0),
        carbs: acc.carbs + (Number(item.carbs) || 0),
        fat: acc.fat + (Number(item.fat) || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    res.json({
      items,
      totals: {
        calories: totals.calories,
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10
      }
    });
  } catch (err) {
    console.error('[Nutrition GET Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve nutrition logs' });
  }
});

// 2. Log a Food Item
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      id,
      name,
      date,
      calories = 0,
      protein = 0,
      carbs = 0,
      fat = 0,
      mealType = 'meal',
      source = 'manual'
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Food item name is required' });
    }

    const now = Date.now();
    const foodId = id || `fd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const logDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO nutrition_logs (
        id, user_id, date, food_name, calories, protein, carbs, fat,
        meal_type, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        food_name = excluded.food_name,
        date = excluded.date,
        calories = excluded.calories,
        protein = excluded.protein,
        carbs = excluded.carbs,
        fat = excluded.fat,
        meal_type = excluded.meal_type,
        source = excluded.source,
        updated_at = excluded.updated_at,
        deleted_at = NULL
    `).run(
      foodId,
      userId,
      logDate,
      name.trim(),
      Number(calories) || 0,
      Number(protein) || 0,
      Number(carbs) || 0,
      Number(fat) || 0,
      mealType,
      source,
      now,
      now
    );

    res.status(201).json({
      success: true,
      item: {
        id: foodId,
        name: name.trim(),
        date: logDate,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        mealType,
        source,
        timestamp: now
      }
    });
  } catch (err) {
    console.error('[Nutrition POST Error]:', err);
    res.status(500).json({ error: 'Failed to record food entry' });
  }
});

// 3. Delete a Food Item (Soft Delete)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const foodId = req.params.id;
    const now = Date.now();

    const result = db.prepare(`
      UPDATE nutrition_logs
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(now, now, foodId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Food entry not found' });
    }

    res.json({ success: true, message: 'Food entry deleted', id: foodId });
  } catch (err) {
    console.error('[Nutrition DELETE Error]:', err);
    res.status(500).json({ error: 'Failed to delete food entry' });
  }
});

export default router;
