/**
 * Request validation and sanitization middleware for Anchor API endpoints.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req, res, next) {
  const { email, password, name } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return res.status(400).json({ error: 'Athlete name is required' });
  }

  req.body.email = email.trim().toLowerCase();
  req.body.name = name.trim();
  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

export function validateGoogleAuth(req, res, next) {
  const { credential, token, access_token, email } = req.body || {};

  // Accepts Google GIS token (credential, token, or access_token) or verified email payload
  if (!credential && !token && !access_token && !email) {
    return res.status(400).json({ error: 'Google credential or verified email is required' });
  }

  next();
}

export function validateDeltaSync(req, res, next) {
  const { lastSyncedAt, mutations } = req.body || {};

  if (lastSyncedAt !== undefined && (typeof lastSyncedAt !== 'number' || isNaN(lastSyncedAt))) {
    return res.status(400).json({ error: 'lastSyncedAt must be a valid numeric timestamp' });
  }

  if (mutations !== undefined && (typeof mutations !== 'object' || mutations === null || Array.isArray(mutations))) {
    return res.status(400).json({ error: 'mutations must be a valid object map' });
  }

  next();
}
