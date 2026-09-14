import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. High-Performance Bidirectional Delta Sync Endpoint
router.post('/delta', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { lastSyncedAt = 0, mutations = {} } = req.body;
    const now = Date.now();

    // -------------------------------------------------------------
    // A. Apply Incoming Client Mutations (Offline queue / local changes)
    // -------------------------------------------------------------

    // 1. Workouts Mutations
    if (Array.isArray(mutations.workouts)) {
      for (const w of mutations.workouts) {
        if (!w.name) continue;
        const sessionId = w.id || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        db.prepare(`
          INSERT INTO workout_sessions (
            id, user_id, name, date, start_time, end_time, duration_min,
            total_volume, planned_sets, completed_sets, status, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            date = excluded.date,
            start_time = excluded.start_time,
            end_time = excluded.end_time,
            duration_min = excluded.duration_min,
            total_volume = excluded.total_volume,
            planned_sets = excluded.planned_sets,
            completed_sets = excluded.completed_sets,
            status = excluded.status,
            updated_at = excluded.updated_at,
            deleted_at = excluded.deleted_at
        `).run(
          sessionId,
          userId,
          w.name.trim(),
          w.date || new Date().toISOString().split('T')[0],
          w.startTime || null,
          w.endTime || null,
          w.durationMin || 0,
          w.totalVolume || 0,
          w.totalPlannedSets || 0,
          w.totalCompletedSets || 0,
          w.status || 'completed',
          w.timestamp || now,
          w.updatedAt || now,
          w.deleted ? now : null
        );

        // Update exercises & sets if not deleted
        if (!w.deleted && Array.isArray(w.exercises)) {
          const oldExs = db.prepare('SELECT id FROM workout_exercises WHERE session_id = ?').all(sessionId);
          for (const oldEx of oldExs) {
            db.prepare('DELETE FROM workout_sets WHERE exercise_id = ?').run(oldEx.id);
          }
          db.prepare('DELETE FROM workout_exercises WHERE session_id = ?').run(sessionId);

          for (let i = 0; i < w.exercises.length; i++) {
            const ex = w.exercises[i];
            const exId = ex.id || `ex_${sessionId}_${i}`;
            db.prepare(`
              INSERT INTO workout_exercises (id, session_id, exercise_name, order_index)
              VALUES (?, ?, ?, ?)
            `).run(exId, sessionId, ex.name || 'Exercise', i);

            if (Array.isArray(ex.sets)) {
              for (let s = 0; s < ex.sets.length; s++) {
                const st = ex.sets[s];
                const setId = st.id || `st_${exId}_${s}`;
                db.prepare(`
                  INSERT INTO workout_sets (id, exercise_id, set_number, weight, reps, completed, rpe)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                  setId,
                  exId,
                  s + 1,
                  Number(st.weight) || 0,
                  Number(st.reps) || 0,
                  st.completed ? 1 : 0,
                  st.rpe ? Number(st.rpe) : null
                );
              }
            }
          }
        }
      }
    }

    // 2. Nutrition Mutations
    if (Array.isArray(mutations.nutrition)) {
      for (const food of mutations.nutrition) {
        if (!food.name) continue;
        const foodId = food.id || `fd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        db.prepare(`
          INSERT INTO nutrition_logs (
            id, user_id, date, food_name, calories, protein, carbs, fat,
            meal_type, source, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            deleted_at = excluded.deleted_at
        `).run(
          foodId,
          userId,
          food.date || new Date().toISOString().split('T')[0],
          food.name.trim(),
          Number(food.calories) || 0,
          Number(food.protein) || 0,
          Number(food.carbs) || 0,
          Number(food.fat) || 0,
          food.mealType || 'meal',
          food.source || 'manual',
          food.timestamp || now,
          food.updatedAt || now,
          food.deleted ? now : null
        );
      }
    }

    // 3. Routines Mutations
    if (Array.isArray(mutations.routines)) {
      for (const rtn of mutations.routines) {
        if (!rtn.name) continue;
        const rtnId = rtn.id || `rtn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        db.prepare(`
          INSERT INTO custom_routines (
            id, user_id, name, focus, difficulty, estimated_min,
            exercises_json, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            focus = excluded.focus,
            difficulty = excluded.difficulty,
            estimated_min = excluded.estimated_min,
            exercises_json = excluded.exercises_json,
            updated_at = excluded.updated_at,
            deleted_at = excluded.deleted_at
        `).run(
          rtnId,
          userId,
          rtn.name.trim(),
          rtn.focus || 'Full Body',
          rtn.difficulty || 'All Levels',
          Number(rtn.estimatedMinutes) || 45,
          JSON.stringify(rtn.exercises || []),
          rtn.createdAt || now,
          rtn.updatedAt || now,
          rtn.deleted ? now : null
        );
      }
    }

    // 4. Training Plan Mutations
    if (mutations.plan && typeof mutations.plan === 'object') {
      const p = mutations.plan;
      const planId = `plan_${userId}`;
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
        p.name || p.splitName || 'Custom Split',
        p.activePresetId || null,
        JSON.stringify(p.weeklySchedule || []),
        Number(p.macroTargets?.calories) || 2100,
        Number(p.macroTargets?.protein) || 180,
        Number(p.macroTargets?.carbs) || 182,
        Number(p.macroTargets?.fat) || 65,
        now,
        now
      );
    }

    // 5. Bodyweight Mutations
    if (Array.isArray(mutations.bodyweight)) {
      for (const bw of mutations.bodyweight) {
        if (!bw.weight) continue;
        const bwId = bw.id || `bw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        db.prepare(`
          INSERT INTO bodyweight_logs (id, user_id, date, weight_kg, timestamp, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            weight_kg = excluded.weight_kg,
            date = excluded.date,
            updated_at = excluded.updated_at
        `).run(
          bwId,
          userId,
          bw.date || new Date().toISOString().split('T')[0],
          Number(bw.weight),
          bw.timestamp || now,
          now
        );
      }
    }

    // -------------------------------------------------------------
    // B. Query Server Updates Since lastSyncedAt
    // -------------------------------------------------------------
    const threshold = Number(lastSyncedAt) || 0;

    // Updated Workouts
    const changedSessions = db.prepare(`
      SELECT * FROM workout_sessions
      WHERE user_id = ? AND updated_at > ?
    `).all(userId, threshold);

    const deltaWorkouts = changedSessions.map(session => {
      const isDeleted = session.deleted_at !== null;
      if (isDeleted) {
        return { id: session.id, deleted: true, updatedAt: session.updated_at };
      }

      const exercises = db.prepare(`
        SELECT * FROM workout_exercises
        WHERE session_id = ?
        ORDER BY order_index ASC
      `).all(session.id);

      const exercisesWithSets = exercises.map(ex => {
        const sets = db.prepare(`
          SELECT * FROM workout_sets
          WHERE exercise_id = ?
          ORDER BY set_number ASC
        `).all(ex.id);

        return {
          id: ex.id,
          name: ex.exercise_name,
          sets: sets.map(s => ({
            id: s.id,
            setNumber: s.set_number,
            weight: s.weight,
            reps: s.reps,
            completed: Boolean(s.completed),
            rpe: s.rpe
          }))
        };
      });

      return {
        id: session.id,
        name: session.name,
        date: session.date,
        startTime: session.start_time,
        endTime: session.end_time,
        durationMin: session.duration_min,
        totalVolume: session.total_volume,
        totalPlannedSets: session.planned_sets,
        totalCompletedSets: session.completed_sets,
        status: session.status,
        timestamp: session.created_at,
        updatedAt: session.updated_at,
        exercises: exercisesWithSets
      };
    });

    // Updated Nutrition
    const changedNutrition = db.prepare(`
      SELECT * FROM nutrition_logs
      WHERE user_id = ? AND updated_at > ?
    `).all(userId, threshold);

    const deltaNutrition = changedNutrition.map(n => ({
      id: n.id,
      name: n.food_name,
      date: n.date,
      calories: n.calories,
      protein: n.protein,
      carbs: n.carbs,
      fat: n.fat,
      mealType: n.meal_type,
      source: n.source,
      timestamp: n.created_at,
      updatedAt: n.updated_at,
      deleted: n.deleted_at !== null
    }));

    // Updated Routines
    const changedRoutines = db.prepare(`
      SELECT * FROM custom_routines
      WHERE user_id = ? AND updated_at > ?
    `).all(userId, threshold);

    const deltaRoutines = changedRoutines.map(r => {
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
        updatedAt: r.updated_at,
        deleted: r.deleted_at !== null
      };
    });

    // Updated Plan
    const changedPlan = db.prepare(`
      SELECT * FROM training_plans
      WHERE user_id = ? AND updated_at > ?
    `).get(userId, threshold);

    let deltaPlan = null;
    if (changedPlan) {
      let schedule = [];
      try {
        schedule = JSON.parse(changedPlan.schedule_json || '[]');
      } catch {
        schedule = [];
      }
      deltaPlan = {
        id: changedPlan.id,
        splitName: changedPlan.split_name,
        activePresetId: changedPlan.active_preset_id,
        weeklySchedule: schedule,
        macroTargets: {
          calories: changedPlan.target_calories,
          protein: changedPlan.target_protein,
          carbs: changedPlan.target_carbs,
          fat: changedPlan.target_fat
        },
        updatedAt: changedPlan.updated_at
      };
    }

    // Updated Bodyweight
    const changedBodyweight = db.prepare(`
      SELECT * FROM bodyweight_logs
      WHERE user_id = ? AND updated_at > ?
    `).all(userId, threshold);

    const deltaBodyweight = changedBodyweight.map(bw => ({
      id: bw.id,
      date: bw.date,
      weight: bw.weight_kg,
      timestamp: bw.timestamp,
      updatedAt: bw.updated_at
    }));

    res.json({
      success: true,
      serverTime: now,
      delta: {
        workouts: deltaWorkouts,
        nutrition: deltaNutrition,
        routines: deltaRoutines,
        plan: deltaPlan,
        bodyweight: deltaBodyweight
      }
    });
  } catch (err) {
    console.error('[Sync Delta Error]:', err);
    res.status(500).json({ error: 'Delta synchronization failed' });
  }
});

// 2. Legacy Fallback Endpoints: GET /api/user/sync & POST /api/user/sync
router.get('/legacy', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const stmt = db.prepare('SELECT data_payload, updated_at FROM user_data WHERE user_id = ?');
    const row = stmt.get(userId);

    if (!row || !row.data_payload) {
      return res.json({ data: null, updatedAt: null });
    }

    const data = JSON.parse(row.data_payload);
    res.json({ data, updatedAt: row.updated_at });
  } catch (err) {
    console.error('[Sync Legacy GET Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve legacy sync data' });
  }
});

router.post('/legacy', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
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
    `).run(userId, payloadStr, now);

    res.json({ success: true, updatedAt: now });
  } catch (err) {
    console.error('[Sync Legacy POST Error]:', err);
    res.status(500).json({ error: 'Failed to record legacy sync data' });
  }
});

export default router;
