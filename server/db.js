import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'anchor.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency and performance, and enforce foreign keys
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

export function initDatabase() {
  db.exec(`
    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'Athlete',
      avatar TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  // Ensure updated_at column exists on pre-existing users tables
  try {
    db.exec(`ALTER TABLE users ADD COLUMN updated_at INTEGER;`);
  } catch (e) {
    // Already exists
  }

  db.exec(`

    -- 2. Training Plans & Daily Targets
    CREATE TABLE IF NOT EXISTS training_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      split_name TEXT,
      active_preset_id TEXT,
      schedule_json TEXT,
      target_calories INTEGER DEFAULT 2100,
      target_protein INTEGER DEFAULT 180,
      target_carbs INTEGER DEFAULT 182,
      target_fat INTEGER DEFAULT 65,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 3. Custom Workout Routines
    CREATE TABLE IF NOT EXISTS custom_routines (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      focus TEXT,
      difficulty TEXT DEFAULT 'All Levels',
      estimated_min INTEGER DEFAULT 45,
      exercises_json TEXT NOT NULL,
      created_at INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER DEFAULT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 4. Workout Sessions
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time INTEGER,
      end_time INTEGER,
      duration_min INTEGER DEFAULT 0,
      total_volume REAL DEFAULT 0,
      planned_sets INTEGER DEFAULT 0,
      completed_sets INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed',
      created_at INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER DEFAULT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 5. Workout Exercises
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY(session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
    );

    -- 6. Workout Sets
    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL DEFAULT 0,
      reps INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 1,
      rpe REAL DEFAULT NULL,
      FOREIGN KEY(exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
    );

    -- 7. Nutrition Logs
    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      meal_type TEXT DEFAULT 'meal',
      source TEXT DEFAULT 'manual',
      created_at INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER DEFAULT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 8. Bodyweight Tracking Logs
    CREATE TABLE IF NOT EXISTS bodyweight_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      timestamp INTEGER,
      updated_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 9. Telemetry & GPS Tracking Streams
    CREATE TABLE IF NOT EXISTS telemetry_streams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      stream_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      distance_km REAL DEFAULT 0,
      avg_hr INTEGER DEFAULT 0,
      timestamp INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 10. Backward-compatible Legacy Sync Payload Table
    CREATE TABLE IF NOT EXISTS user_data (
      user_id TEXT PRIMARY KEY,
      data_payload TEXT,
      updated_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Indexes for lightning fast lookups
    CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON workout_sessions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_nutrition_user_date ON nutrition_logs(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_exercises_session ON workout_exercises(session_id);
    CREATE INDEX IF NOT EXISTS idx_sets_exercise ON workout_sets(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_routines_user ON custom_routines(user_id);
    CREATE INDEX IF NOT EXISTS idx_telemetry_user ON telemetry_streams(user_id);
  `);

  // Run automatic data migration from legacy user_data payloads to normalized tables
  migrateLegacyData();
}

/**
 * Migration helper: unpacks monolithic user_data JSON payloads into normalized tables
 */
function migrateLegacyData() {
  try {
    const legacyStmt = db.prepare('SELECT user_id, data_payload, updated_at FROM user_data');
    const legacyRows = legacyStmt.all();

    for (const row of legacyRows) {
      if (!row.data_payload) continue;
      let parsed;
      try {
        parsed = JSON.parse(row.data_payload);
      } catch {
        continue;
      }

      const userId = row.user_id;
      const now = row.updated_at || Date.now();

      // 1. Migrate Plan
      if (parsed.plan) {
        const planExists = db.prepare('SELECT id FROM training_plans WHERE user_id = ?').get(userId);
        if (!planExists) {
          const planId = `plan_${userId}`;
          const splitName = parsed.plan.name || parsed.plan.splitName || 'Custom Split';
          const presetId = parsed.plan.activePresetId || null;
          const scheduleJson = JSON.stringify(parsed.plan.weeklySchedule || []);
          const targetCalories = parsed.plan.macroTargets?.calories || 2100;
          const targetProtein = parsed.plan.macroTargets?.protein || 180;
          const targetCarbs = parsed.plan.macroTargets?.carbs || 182;
          const targetFat = parsed.plan.macroTargets?.fat || 65;

          db.prepare(`
            INSERT INTO training_plans (id, user_id, split_name, active_preset_id, schedule_json, target_calories, target_protein, target_carbs, target_fat, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(planId, userId, splitName, presetId, scheduleJson, targetCalories, targetProtein, targetCarbs, targetFat, now, now);
        }
      }

      // 2. Migrate Custom Routines
      if (Array.isArray(parsed.customRoutines)) {
        for (const routine of parsed.customRoutines) {
          const routineId = routine.id || `rtn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const exists = db.prepare('SELECT id FROM custom_routines WHERE id = ?').get(routineId);
          if (!exists) {
            db.prepare(`
              INSERT INTO custom_routines (id, user_id, name, focus, difficulty, estimated_min, exercises_json, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              routineId,
              userId,
              routine.name || 'Custom Routine',
              routine.focus || 'Full Body',
              routine.difficulty || 'All Levels',
              routine.estimatedMinutes || 45,
              JSON.stringify(routine.exercises || []),
              routine.createdAt || now,
              now
            );
          }
        }
      }

      // 3. Migrate Workouts
      if (Array.isArray(parsed.workouts)) {
        for (const w of parsed.workouts) {
          const sessionId = w.id || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const exists = db.prepare('SELECT id FROM workout_sessions WHERE id = ?').get(sessionId);
          if (!exists) {
            db.prepare(`
              INSERT INTO workout_sessions (id, user_id, name, date, start_time, end_time, duration_min, total_volume, planned_sets, completed_sets, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              sessionId,
              userId,
              w.name || 'Workout Session',
              w.date || new Date().toISOString().split('T')[0],
              w.startTime || null,
              w.endTime || null,
              w.durationMin || 0,
              w.totalVolume || 0,
              w.totalPlannedSets || 0,
              w.totalCompletedSets || 0,
              w.status || 'completed',
              w.timestamp || now,
              now
            );

            // Insert exercises & sets if present
            if (Array.isArray(w.exercises)) {
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
      }

      // 4. Migrate Nutrition Logs
      if (Array.isArray(parsed.foodLogs)) {
        for (const food of parsed.foodLogs) {
          const foodId = food.id || `fd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const exists = db.prepare('SELECT id FROM nutrition_logs WHERE id = ?').get(foodId);
          if (!exists) {
            db.prepare(`
              INSERT INTO nutrition_logs (id, user_id, date, food_name, calories, protein, carbs, fat, meal_type, source, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              foodId,
              userId,
              food.date || new Date().toISOString().split('T')[0],
              food.name || 'Food Item',
              Number(food.calories) || 0,
              Number(food.protein) || 0,
              Number(food.carbs) || 0,
              Number(food.fat) || 0,
              food.mealType || 'meal',
              food.source || 'manual',
              food.timestamp || now,
              now
            );
          }
        }
      }

      // 5. Migrate Bodyweight History
      if (Array.isArray(parsed.bodyweightHistory)) {
        for (const bw of parsed.bodyweightHistory) {
          const bwId = bw.id || `bw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const exists = db.prepare('SELECT id FROM bodyweight_logs WHERE id = ?').get(bwId);
          if (!exists) {
            db.prepare(`
              INSERT INTO bodyweight_logs (id, user_id, date, weight_kg, timestamp, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              bwId,
              userId,
              bw.date || new Date().toISOString().split('T')[0],
              Number(bw.weight) || 75,
              bw.timestamp || now,
              now
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('[Anchor Database Migration] Warning during legacy data unpacking:', err);
  }
}
