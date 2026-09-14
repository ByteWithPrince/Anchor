import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Get Active Training Plan & Daily Macro Targets
router.get('/active', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const plan = db.prepare('SELECT * FROM training_plans WHERE user_id = ?').get(userId);

    if (!plan) {
      // Default fallback
      return res.json({
        plan: {
          id: `plan_${userId}`,
          splitName: 'Push / Pull / Legs (PPL)',
          activePresetId: 'ppl-6day',
          weeklySchedule: [],
          macroTargets: {
            calories: 2100,
            protein: 180,
            carbs: 182,
            fat: 65
          },
          updatedAt: Date.now()
        }
      });
    }

    let schedule = [];
    try {
      schedule = JSON.parse(plan.schedule_json || '[]');
    } catch {
      schedule = [];
    }

    res.json({
      plan: {
        id: plan.id,
        splitName: plan.split_name,
        activePresetId: plan.active_preset_id,
        weeklySchedule: schedule,
        macroTargets: {
          calories: plan.target_calories,
          protein: plan.target_protein,
          carbs: plan.target_carbs,
          fat: plan.target_fat
        },
        updatedAt: plan.updated_at
      }
    });
  } catch (err) {
    console.error('[Plans Active GET Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve training plan' });
  }
});

// 2. Update Active Training Plan & Daily Macro Targets
router.put('/active', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      splitName,
      activePresetId,
      weeklySchedule = [],
      macroTargets = {}
    } = req.body;

    const now = Date.now();
    const planId = `plan_${userId}`;
    const scheduleJson = JSON.stringify(weeklySchedule);

    const targetCalories = Number(macroTargets.calories) || 2100;
    const targetProtein = Number(macroTargets.protein) || 180;
    const targetCarbs = Number(macroTargets.carbs) || 182;
    const targetFat = Number(macroTargets.fat) || 65;

    db.prepare(`
      INSERT INTO training_plans (
        id, user_id, split_name, active_preset_id, schedule_json,
        target_calories, target_protein, target_carbs, target_fat,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        split_name = excluded.split_name,
        active_preset_id = excluded.active_preset_id,
        schedule_json = excluded.schedule_json,
        target_calories = excluded.target_calories,
        target_protein = excluded.target_protein,
        target_carbs = excluded.target_carbs,
        target_fat = excluded.target_fat,
        updated_at = excluded.updated_at
    `).run(
      planId,
      userId,
      splitName || 'Custom Split',
      activePresetId || null,
      scheduleJson,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      now,
      now
    );

    res.json({
      success: true,
      plan: {
        id: planId,
        splitName: splitName || 'Custom Split',
        activePresetId,
        weeklySchedule,
        macroTargets: {
          calories: targetCalories,
          protein: targetProtein,
          carbs: targetCarbs,
          fat: targetFat
        },
        updatedAt: now
      }
    });
  } catch (err) {
    console.error('[Plans Active PUT Error]:', err);
    res.status(500).json({ error: 'Failed to update training plan' });
  }
});

// 3. List Custom Routines
router.get('/routines', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const rows = db.prepare(`
      SELECT * FROM custom_routines
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY updated_at DESC
    `).all(userId);

    const routines = rows.map(r => {
      let exercises = [];
      try {
        exercises = JSON.parse(r.exercises_json || '[]');
      } catch {
        exercises = [];
      }

      return {
        id: r.id,
        name: r.name,
        focus: r.focus,
        difficulty: r.difficulty,
        estimatedMinutes: r.estimated_min,
        exercises,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    });

    res.json({ routines });
  } catch (err) {
    console.error('[Plans Routines GET Error]:', err);
    res.status(500).json({ error: 'Failed to load custom routines' });
  }
});

// 4. Create or Update Custom Routine
router.post('/routines', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      id,
      name,
      focus = 'Full Body',
      difficulty = 'All Levels',
      estimatedMinutes = 45,
      exercises = []
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Routine name is required' });
    }

    const now = Date.now();
    const routineId = id || `rtn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const exercisesJson = JSON.stringify(exercises);

    db.prepare(`
      INSERT INTO custom_routines (
        id, user_id, name, focus, difficulty, estimated_min,
        exercises_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        focus = excluded.focus,
        difficulty = excluded.difficulty,
        estimated_min = excluded.estimated_min,
        exercises_json = excluded.exercises_json,
        updated_at = excluded.updated_at,
        deleted_at = NULL
    `).run(
      routineId,
      userId,
      name.trim(),
      focus,
      difficulty,
      Number(estimatedMinutes) || 45,
      exercisesJson,
      now,
      now
    );

    res.status(201).json({
      success: true,
      routine: {
        id: routineId,
        name: name.trim(),
        focus,
        difficulty,
        estimatedMinutes: Number(estimatedMinutes) || 45,
        exercises,
        updatedAt: now
      }
    });
  } catch (err) {
    console.error('[Plans Routines POST Error]:', err);
    res.status(500).json({ error: 'Failed to save custom routine' });
  }
});

// 5. Delete Custom Routine (Soft Delete)
router.delete('/routines/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const routineId = req.params.id;
    const now = Date.now();

    const result = db.prepare(`
      UPDATE custom_routines
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(now, now, routineId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Custom routine not found' });
    }

    res.json({ success: true, message: 'Custom routine deleted', id: routineId });
  } catch (err) {
    console.error('[Plans Routines DELETE Error]:', err);
    res.status(500).json({ error: 'Failed to delete custom routine' });
  }
});

export default router;
