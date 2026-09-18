/**
 * Lightweight sliding-window rate limiter middleware for Express.
 * Tracks client IP requests in-memory with automatic cleanup of expired records.
 */

class SlidingWindowRateLimiter {
  constructor({ windowMs = 60 * 1000, max = 60, message = 'Too many requests, please try again later.' } = {}) {
    this.windowMs = windowMs;
    this.max = max;
    this.message = message;
    this.hits = new Map();

    // Periodically evict expired entries to prevent memory accumulation
    this.cleanupInterval = setInterval(() => this.cleanup(), Math.max(windowMs, 30000));
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.hits.entries()) {
      const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
      if (validTimestamps.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, validTimestamps);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      // Extract client IP address (supporting reverse proxy headers)
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      const now = Date.now();

      // In development / local testing, allow local loopback requests without throttling
      if (process.env.NODE_ENV !== 'production' && (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.includes('127.0.0.1'))) {
        return next();
      }

      let timestamps = this.hits.get(clientIp) || [];
      timestamps = timestamps.filter(ts => now - ts < this.windowMs);

      if (timestamps.length >= this.max) {
        const oldestTimestamp = timestamps[0];
        const retryAfterSec = Math.ceil((this.windowMs - (now - oldestTimestamp)) / 1000);
        res.set('Retry-After', String(retryAfterSec));
        return res.status(429).json({
          error: this.message,
          retryAfter: retryAfterSec
        });
      }

      timestamps.push(now);
      this.hits.set(clientIp, timestamps);
      next();
    };
  }
}

const isProd = process.env.NODE_ENV === 'production';

// 1. Strict Auth Rate Limiter: 30 attempts / 15 minutes per IP
export const authRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 1000,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
}).middleware();

// 2. Sync Rate Limiter: 120 delta calls / minute per IP
export const syncRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: isProd ? 120 : 2000,
  message: 'Sync rate limit exceeded. Please throttle background delta sync calls.'
}).middleware();

// 3. General API Limiter: 300 calls / minute per IP
export const generalRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  max: isProd ? 300 : 5000,
  message: 'API rate limit exceeded. Please slow down your requests.'
}).middleware();
