import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter:
 * Maximum 100 requests per 15 minutes per client IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: 'Too Many Requests',
    message:
      'Too many API requests from this IP address. Please try again after 15 minutes.',
  },
});

/**
 * Stricter Login Endpoint Rate Limiter:
 * Maximum 5 requests per 15 minutes per client IP to prevent brute-force login attempts.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: 'Too Many Requests',
    message:
      'Too many login attempts from this IP address. Please try again after 15 minutes.',
  },
});
