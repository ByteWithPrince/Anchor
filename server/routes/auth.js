import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. User Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'Athlete' } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if account already exists
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const existing = checkStmt.get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, cleanEmail, passwordHash, name.trim(), role.trim(), avatar, now, now);

    // Initialize a default starter training plan
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
      2100,
      180,
      182,
      65,
      now,
      now
    );

    const token = generateToken({ userId, email: cleanEmail, name: name.trim(), role: role.trim() });

    res.status(201).json({
      token,
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
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// 2. User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    res.json({
      token,
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

// 3. Current User Profile
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

// 4. Update Profile
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

export default router;
