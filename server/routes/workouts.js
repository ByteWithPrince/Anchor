import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. List Workout Sessions (with nested exercises and sets)
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM workout_sessions
      WHERE user_id = ? AND deleted_at IS NULL
    `;
    const params = [userId];

    if (date) {
      query += ` AND date = ?`;
      params.push(date);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const sessions = db.prepare(query).all(...params);

    // Hydrate nested exercises & sets for each session
    const fullSessions = sessions.map(session => {
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
          orderIndex: ex.order_index,
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
        exercises: exercisesWithSets
      };
    });

    res.json({ sessions: fullSessions });
  } catch (err) {
    console.error('[Workouts GET Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve workout sessions' });
  }
});

// 2. Get Single Workout Session by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionId = req.params.id;

    const session = db.prepare(`
      SELECT * FROM workout_sessions
      WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `).get(sessionId, userId);

    if (!session) {
      return res.status(404).json({ error: 'Workout session not found' });
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
        orderIndex: ex.order_index,
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

    res.json({
      session: {
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
        exercises: exercisesWithSets
      }
    });
  } catch (err) {
    console.error('[Workouts GET Single Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve workout session' });
  }
});

// 3. Log a New Workout Session
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      id,
      name,
      date,
      startTime,
      endTime,
      durationMin = 0,
      totalVolume = 0,
      totalPlannedSets = 0,
      totalCompletedSets = 0,
      status = 'completed',
      exercises = []
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workout name is required' });
    }

    const now = Date.now();
    const sessionId = id || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sessionDate = date || new Date().toISOString().split('T')[0];

    // Calculate volume & completed sets if not provided
    let calcVolume = 0;
    let calcCompletedSets = 0;
    let calcPlannedSets = 0;

    exercises.forEach(ex => {
      if (Array.isArray(ex.sets)) {
        calcPlannedSets += ex.sets.length;
        ex.sets.forEach(st => {
          if (st.completed) {
            calcCompletedSets++;
            calcVolume += (Number(st.weight) || 0) * (Number(st.reps) || 0);
          }
        });
      }
    });

    const finalVolume = totalVolume > 0 ? totalVolume : calcVolume;
    const finalCompletedSets = totalCompletedSets > 0 ? totalCompletedSets : calcCompletedSets;
    const finalPlannedSets = totalPlannedSets > 0 ? totalPlannedSets : calcPlannedSets;

    // Upsert session
    db.prepare(`
      INSERT INTO workout_sessions (
        id, user_id, name, date, start_time, end_time, duration_min,
        total_volume, planned_sets, completed_sets, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        deleted_at = NULL
    `).run(
      sessionId,
      userId,
      name.trim(),
      sessionDate,
      startTime || null,
      endTime || null,
      durationMin,
      finalVolume,
      finalPlannedSets,
      finalCompletedSets,
      status,
      now,
      now
    );

    // Clean existing exercises if updating
    const existingExs = db.prepare('SELECT id FROM workout_exercises WHERE session_id = ?').all(sessionId);
    for (const oldEx of existingExs) {
      db.prepare('DELETE FROM workout_sets WHERE exercise_id = ?').run(oldEx.id);
    }
    db.prepare('DELETE FROM workout_exercises WHERE session_id = ?').run(sessionId);

    // Insert nested exercises & sets
    if (Array.isArray(exercises)) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
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

    res.status(201).json({
      success: true,
      sessionId,
      totalVolume: finalVolume,
      completedSets: finalCompletedSets,
      session: {
        id: sessionId,
        name: name.trim(),
        date: sessionDate,
        totalVolume: finalVolume,
        completedSets: finalCompletedSets
      }
    });
  } catch (err) {
    console.error('[Workouts POST Error]:', err);
    res.status(500).json({ error: 'Failed to log workout session' });
  }
});

// 4. Delete Workout Session (Soft Delete)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionId = req.params.id;
    const now = Date.now();

    const result = db.prepare(`
      UPDATE workout_sessions
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(now, now, sessionId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Workout session not found' });
    }

    res.json({ success: true, message: 'Workout session deleted', id: sessionId });
  } catch (err) {
    console.error('[Workouts DELETE Error]:', err);
    res.status(500).json({ error: 'Failed to delete workout session' });
  }
});

// 5. Personal Records (PRs) per Exercise
router.get(['/stats/prs', '/history/prs'], authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;

    const prRows = db.prepare(`
      SELECT 
        e.exercise_name,
        MAX(s.weight) as max_weight,
        MAX(s.reps) as max_reps,
        MAX(s.weight * (1.0 + (s.reps / 30.0))) as estimated_1rm,
        MAX(ws.created_at) as achieved_at
      FROM workout_sets s
      JOIN workout_exercises e ON s.exercise_id = e.id
      JOIN workout_sessions ws ON e.session_id = ws.id
      WHERE ws.user_id = ? AND ws.deleted_at IS NULL AND s.completed = 1 AND s.weight > 0
      GROUP BY e.exercise_name
      ORDER BY max_weight DESC
    `).all(userId);

    const prs = prRows.map(row => ({
      exercise: row.exercise_name,
      maxWeight: Math.round(row.max_weight * 10) / 10,
      maxReps: row.max_reps,
      estimated1RM: Math.round(row.estimated_1rm * 10) / 10,
      achievedAt: row.achieved_at
    }));

    res.json({ prs });
  } catch (err) {
    console.error('[Workouts PRs Error]:', err);
    res.status(500).json({ error: 'Failed to calculate personal records' });
  }
});

export default router;
