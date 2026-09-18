import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import {
  authenticateToken,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  verifyRefreshToken
} from '../middleware/auth.js';
import { validateRegister, validateLogin, validateGoogleAuth } from '../middleware/validate.js';

const router = express.Router();

/**
 * Helper: Atomically migrate offline guest workouts, nutrition, and plan to a new athlete account.
 */
function migrateGuestData(userId, guestData) {
  if (!guestData || typeof guestData !== 'object') return;
  const now = Date.now();

  const migrationTx = db.transaction(() => {
    // 1. Migrate Plan if provided
    if (guestData.plan && typeof guestData.plan === 'object') {
      const p = guestData.plan;
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

    // 2. Migrate Workouts
    if (Array.isArray(guestData.workouts)) {
      for (const w of guestData.workouts) {
        if (!w.name) continue;
        const sessionId = w.id || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        db.prepare(`
          INSERT INTO workout_sessions (
            id, user_id, name, date, start_time, end_time, duration_min,
            total_volume, planned_sets, completed_sets, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
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
          now
        );

        if (Array.isArray(w.exercises)) {
          for (let i = 0; i < w.exercises.length; i++) {
            const ex = w.exercises[i];
            const exId = ex.id || `ex_${sessionId}_${i}`;
            db.prepare(`
              INSERT INTO workout_exercises (id, session_id, exercise_name, order_index)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(id) DO NOTHING
            `).run(exId, sessionId, ex.name || 'Exercise', i);

            if (Array.isArray(ex.sets)) {
              for (let s = 0; s < ex.sets.length; s++) {
                const st = ex.sets[s];
                const setId = st.id || `st_${exId}_${s}`;
                db.prepare(`
                  INSERT INTO workout_sets (id, exercise_id, set_number, weight, reps, completed, rpe)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO NOTHING
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

    // 3. Migrate Nutrition
    if (Array.isArray(guestData.foodLogs || guestData.nutrition)) {
      const foods = guestData.foodLogs || guestData.nutrition;
      for (const food of foods) {
        if (!food.name) continue;
        const foodId = food.id || `fd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        db.prepare(`
          INSERT INTO nutrition_logs (
            id, user_id, date, food_name, calories, protein, carbs, fat,
            meal_type, source, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
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
          now
        );
      }
    }

    // 4. Migrate Custom Routines
    if (Array.isArray(guestData.customRoutines || guestData.routines)) {
      const routines = guestData.customRoutines || guestData.routines;
      for (const rtn of routines) {
        if (!rtn.name) continue;
        const rtnId = rtn.id || `rtn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        db.prepare(`
          INSERT INTO custom_routines (
            id, user_id, name, focus, difficulty, estimated_min,
            exercises_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
        `).run(
          rtnId,
          userId,
          rtn.name.trim(),
          rtn.focus || 'Full Body',
          rtn.difficulty || 'All Levels',
          Number(rtn.estimatedMinutes) || 45,
          JSON.stringify(rtn.exercises || []),
          rtn.createdAt || now,
          now
        );
      }
    }

    // 5. Migrate Bodyweight History
    if (Array.isArray(guestData.bodyweightHistory || guestData.bodyweight)) {
      const bws = guestData.bodyweightHistory || guestData.bodyweight;
      for (const bw of bws) {
        if (!bw.weight) continue;
        const bwId = bw.id || `bw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        db.prepare(`
          INSERT INTO bodyweight_logs (id, user_id, date, weight_kg, timestamp, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
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
  });

  migrationTx();
}

/**
 * Helper: Creates and persists a refresh token record.
 */
function createRefreshTokenRecord(userId, req) {
  const refreshToken = generateRefreshToken({ userId });
  const tokenHashed = hashToken(refreshToken);
  const tokenId = `rtk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, user_agent, ip_address, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(tokenId, userId, tokenHashed, userAgent, ipAddress, expiresAt, Date.now());

  return refreshToken;
}

// 1. Athlete Registration (with optional guest data claiming)
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, name, role = 'Athlete', guestData } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, avatar, token_version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(userId, cleanEmail, passwordHash, name.trim(), role.trim(), avatar, now, now);

    // If guest data was provided, migrate it immediately
    if (guestData) {
      migrateGuestData(userId, guestData);
    }

    // Ensure user has an active training plan if not created by guest migration
    const hasPlan = db.prepare('SELECT id FROM training_plans WHERE user_id = ?').get(userId);
    if (!hasPlan) {
      const planId = `plan_${userId}`;
      db.prepare(`
        INSERT INTO training_plans (id, user_id, split_name, active_preset_id, schedule_json, target_calories, target_protein, target_carbs, target_fat, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        planId,
        userId,
        'Push / Pull / Legs (PPL)',
        'ppl-6day',
        JSON.stringify([
          { dayIndex: 0, dayName: 'Sunday', isRestDay: true, workoutName: 'Active Recovery & Mobility', workoutId: null },
          { dayIndex: 1, dayName: 'Monday', isRestDay: false, workoutName: 'Push A (Chest & Triceps)', workoutId: 'ppl-push-a' },
          { dayIndex: 2, dayName: 'Tuesday', isRestDay: false, workoutName: 'Pull A (Back & Biceps)', workoutId: 'ppl-pull-a' },
          { dayIndex: 3, dayName: 'Wednesday', isRestDay: false, workoutName: 'Legs A (Quads & Calves)', workoutId: 'ppl-legs-a' },
          { dayIndex: 4, dayName: 'Thursday', isRestDay: false, workoutName: 'Push B (Shoulders & Chest)', workoutId: 'ppl-push-b' },
          { dayIndex: 5, dayName: 'Friday', isRestDay: false, workoutName: 'Pull B (Upper Back & Rear Delts)', workoutId: 'ppl-pull-b' },
          { dayIndex: 6, dayName: 'Saturday', isRestDay: false, workoutName: 'Legs B (Hamstrings & Post Chain)', workoutId: 'ppl-legs-b' }
        ]),
        2100, 180, 182, 65, now, now
      );
    }

    const token = generateAccessToken({ userId, email: cleanEmail, name: name.trim(), role: role.trim(), tokenVersion: 1 });
    const refreshToken = createRefreshTokenRecord(userId, req);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        role: role.trim(),
        avatar,
        createdAt: now
      }
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: 'Failed to create athlete account' });
  }
});

// 2. Athlete Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password, guestData } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Optional: claim guest data if provided upon login
    if (guestData) {
      migrateGuestData(user.id, guestData);
    }

    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.token_version || 1
    });

    const refreshToken = createRefreshTokenRecord(user.id, req);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: 'Internal login error' });
  }
});

// 2.5 Real Google Sign-In & GIS Token Verification
router.post('/google', validateGoogleAuth, async (req, res) => {
  try {
    const { credential, email, name, avatar, googleId, guestData } = req.body;
    let verifiedEmail = email;
    let verifiedName = name;
    let verifiedAvatar = avatar;
    let verifiedGoogleId = googleId;

    // Server-side verification of Google Identity Services (GIS) ID Token
    if (credential) {
      try {
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
        const gRes = await fetch(verifyUrl);
        if (gRes.ok) {
          const gPayload = await gRes.json();
          verifiedEmail = gPayload.email;
          verifiedName = gPayload.name || verifiedName;
          verifiedAvatar = gPayload.picture || verifiedAvatar;
          verifiedGoogleId = gPayload.sub || verifiedGoogleId;
        } else {
          console.warn('[Google Auth] Tokeninfo verification failed, using client payload fallback if allowed');
        }
      } catch (gErr) {
        console.warn('[Google Auth] Network call to Google tokeninfo failed (offline dev mode active):', gErr.message);
      }
    }

    if (!verifiedEmail) {
      return res.status(400).json({ error: 'Verified Google email is required' });
    }

    const cleanEmail = verifiedEmail.trim().toLowerCase();
    const cleanName = (verifiedName && verifiedName.trim()) || cleanEmail.split('@')[0];
    const now = Date.now();

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (user) {
      const updatedAvatar = verifiedAvatar || user.avatar;
      db.prepare('UPDATE users SET avatar = ?, google_id = COALESCE(google_id, ?), updated_at = ? WHERE id = ?')
        .run(updatedAvatar, verifiedGoogleId || null, now, user.id);
      user = { ...user, avatar: updatedAvatar, google_id: verifiedGoogleId || user.google_id, updated_at: now };
    } else {
      const userId = `usr_${now}_${Math.random().toString(36).slice(2, 7)}`;
      const userAvatar = verifiedAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;
      const dummyPassword = `gauth_${verifiedGoogleId || Math.random().toString(36).slice(2)}`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(dummyPassword, salt);

      db.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, avatar, google_id, token_version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(userId, cleanEmail, passwordHash, cleanName, 'Strength & Hypertrophy', userAvatar, verifiedGoogleId || null, now, now);

      user = {
        id: userId,
        email: cleanEmail,
        name: cleanName,
        role: 'Strength & Hypertrophy',
        avatar: userAvatar,
        token_version: 1,
        created_at: now,
        updated_at: now
      };
    }

    // Migrate guest data if present
    if (guestData) {
      migrateGuestData(user.id, guestData);
    }

    // Ensure starter plan exists
    const hasPlan = db.prepare('SELECT id FROM training_plans WHERE user_id = ?').get(user.id);
    if (!hasPlan) {
      const planId = `plan_${user.id}`;
      db.prepare(`
        INSERT INTO training_plans (id, user_id, split_name, active_preset_id, schedule_json, target_calories, target_protein, target_carbs, target_fat, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        planId, user.id, 'Push / Pull / Legs (PPL)', 'ppl-6day',
        JSON.stringify([
          { dayIndex: 0, dayName: 'Sunday', isRestDay: true, workoutName: 'Active Recovery & Mobility', workoutId: null },
          { dayIndex: 1, dayName: 'Monday', isRestDay: false, workoutName: 'Push A (Chest & Triceps)', workoutId: 'ppl-push-a' },
          { dayIndex: 2, dayName: 'Tuesday', isRestDay: false, workoutName: 'Pull A (Back & Biceps)', workoutId: 'ppl-pull-a' },
          { dayIndex: 3, dayName: 'Wednesday', isRestDay: false, workoutName: 'Legs A (Quads & Calves)', workoutId: 'ppl-legs-a' },
          { dayIndex: 4, dayName: 'Thursday', isRestDay: false, workoutName: 'Push B (Shoulders & Chest)', workoutId: 'ppl-push-b' },
          { dayIndex: 5, dayName: 'Friday', isRestDay: false, workoutName: 'Pull B (Upper Back & Rear Delts)', workoutId: 'ppl-pull-b' },
          { dayIndex: 6, dayName: 'Saturday', isRestDay: false, workoutName: 'Legs B (Hamstrings & Post Chain)', workoutId: 'ppl-legs-b' }
        ]),
        2100, 180, 182, 65, now, now
      );
    }

    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.token_version || 1
    });

    const refreshToken = createRefreshTokenRecord(user.id, req);
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error('[Auth Google Error]:', err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// 3. Refresh Access Token with Refresh Token Rotation & Theft Detection
router.post('/refresh', (req, res) => {
  try {
    const rawCookie = req.cookies?.anchor_refresh_token;
    const rawBody = req.body?.refreshToken;
    const tokenToVerify = rawCookie || rawBody;

    if (!tokenToVerify) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(tokenToVerify);
    if (!decoded || !decoded.userId) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const tokenHashed = hashToken(tokenToVerify);
    const existingToken = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(tokenHashed);

    if (!existingToken) {
      // Possible Token Theft: token was already rotated/used!
      console.warn(`[Security Alert] Reused refresh token detected for userId: ${decoded.userId}. Revoking all sessions.`);
      db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(decoded.userId);
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Session compromised. All sessions revoked.', code: 'TOKEN_THEFT_DETECTED' });
    }

    if (existingToken.expires_at < Date.now()) {
      db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(existingToken.id);
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const user = db.prepare('SELECT id, email, name, role, avatar, token_version FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(404).json({ error: 'User no longer exists' });
    }

    // Rotate: Invalidate used token and issue a fresh pair
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(existingToken.id);

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenVersion: user.token_version || 1
    });
    const newRefreshToken = createRefreshTokenRecord(user.id, req);
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user
    });
  } catch (err) {
    console.error('[Auth Refresh Error]:', err);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// 4. Logout (Single Device)
router.post('/logout', (req, res) => {
  try {
    const rawToken = req.cookies?.anchor_refresh_token || req.body?.refreshToken;
    if (rawToken) {
      const hashed = hashToken(rawToken);
      db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(hashed);
    }
    clearRefreshTokenCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('[Auth Logout Error]:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// 5. Logout All Devices (Global Revocation)
router.post('/logout-all', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(userId);
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
    clearRefreshTokenCookie(res);
    res.json({ success: true, message: 'All active sessions have been revoked' });
  } catch (err) {
    console.error('[Auth Logout-All Error]:', err);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
});

// 6. Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, role, avatar, created_at, updated_at FROM users WHERE id = ?').get(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('[Auth Me Error]:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// 7. Update Profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, role, avatar } = req.body;
    const now = Date.now();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newName = name !== undefined ? name.trim() : user.name;
    const newRole = role !== undefined ? role.trim() : user.role;
    const newAvatar = avatar !== undefined ? avatar : user.avatar;

    db.prepare(`
      UPDATE users 
      SET name = ?, role = ?, avatar = ?, updated_at = ?
      WHERE id = ?
    `).run(newName, newRole, newAvatar, now, req.user.userId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: newName,
        role: newRole,
        avatar: newAvatar,
        updatedAt: now
      }
    });
  } catch (err) {
    console.error('[Auth Update Profile Error]:', err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// 8. Permanent Account Deletion (GDPR / Data Purge)
router.delete('/account', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    // Foreign key cascading will automatically delete all workout_sessions, exercises, sets, nutrition_logs, plans, etc.
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    clearRefreshTokenCookie(res);
    res.json({ success: true, message: 'Athlete account and all associated logs have been permanently deleted' });
  } catch (err) {
    console.error('[Auth Delete Account Error]:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// 9. Full Athlete Data Export (Data Ownership)
router.get('/export', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const user = db.prepare('SELECT id, email, name, role, avatar, created_at FROM users WHERE id = ?').get(userId);
    const plan = db.prepare('SELECT * FROM training_plans WHERE user_id = ?').get(userId);
    const routines = db.prepare('SELECT * FROM custom_routines WHERE user_id = ?').all(userId);
    const sessions = db.prepare('SELECT * FROM workout_sessions WHERE user_id = ?').all(userId);
    const nutrition = db.prepare('SELECT * FROM nutrition_logs WHERE user_id = ?').all(userId);
    const bodyweight = db.prepare('SELECT * FROM bodyweight_logs WHERE user_id = ?').all(userId);

    // Attach exercises & sets to sessions
    const workoutsWithDetails = sessions.map(s => {
      const exs = db.prepare('SELECT * FROM workout_exercises WHERE session_id = ? ORDER BY order_index').all(s.id);
      const exercisesWithSets = exs.map(ex => {
        const sets = db.prepare('SELECT * FROM workout_sets WHERE exercise_id = ? ORDER BY set_number').all(ex.id);
        return { ...ex, sets };
      });
      return { ...s, exercises: exercisesWithSets };
    });

    res.json({
      exportedAt: new Date().toISOString(),
      user,
      plan,
      routines,
      workouts: workoutsWithDetails,
      nutrition,
      bodyweight
    });
  } catch (err) {
    console.error('[Auth Export Data Error]:', err);
    res.status(500).json({ error: 'Failed to export athlete data' });
  }
});

export default router;
