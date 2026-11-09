import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/auth/register — Register a new user
router.post('/register', registerUser);

// POST /api/auth/login — Authenticate user and return a JWT (rate-limited: 5 req / 15 min)
router.post('/login', loginLimiter, loginUser);

// GET /api/auth/me — Get current authenticated user profile
router.get('/me', authenticateToken, getCurrentUser);

export default router;
