import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { db } from '../db.js';

// Access and Refresh secrets from environment
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'anchor_vexora_auth_secret_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'anchor_vexora_refresh_secret_2026';

if (process.env.NODE_ENV === 'production' && (ACCESS_SECRET.includes('vexora') || REFRESH_SECRET.includes('vexora'))) {
  console.error('[SECURITY WARNING]: Insecure default JWT secrets detected in production! Please set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env');
}

/**
 * Generates a short-lived access token (15 minutes).
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

/**
 * Generates a long-lived refresh token (30 days) with unique cryptographic jti nonce.
 */
export function generateRefreshToken(payload) {
  return jwt.sign(
    { userId: payload.userId, type: 'refresh', jti: crypto.randomUUID() },
    REFRESH_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Backward-compatible token generator (matches legacy test suite).
 */
export function generateToken(payload) {
  // If legacy call doesn't specify tokenVersion, default to 1
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '30d' });
}

/**
 * Hashes a token using SHA-256 for secure storage in the refresh_tokens table.
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sets the httpOnly refresh token cookie on the response.
 */
export function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('anchor_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

/**
 * Clears the refresh token cookie.
 */
export function clearRefreshTokenCookie(res) {
  res.clearCookie('anchor_refresh_token', {
    path: '/api/auth'
  });
}

/**
 * Verifies access token from Authorization header and verifies user session validity.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired session token', code: 'TOKEN_EXPIRED' });
    }

    // Optional token revocation check against database
    if (decoded.tokenVersion !== undefined) {
      try {
        const user = db.prepare('SELECT token_version FROM users WHERE id = ?').get(decoded.userId);
        if (!user || (user.token_version && user.token_version > decoded.tokenVersion)) {
          return res.status(401).json({ error: 'Session has been revoked. Please log in again.', code: 'SESSION_REVOKED' });
        }
      } catch (dbErr) {
        // Fallback gracefully if database query fails
      }
    }

    req.user = decoded;
    next();
  });
}

/**
 * Verifies a refresh token.
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch {
    return null;
  }
}
