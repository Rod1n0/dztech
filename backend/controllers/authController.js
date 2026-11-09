import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Registers a new user account with a hashed password.
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name, email, and password are required fields.',
      });
    }

    const trimmedName = String(name).trim();
    const normalizedEmail = String(email).toLowerCase().trim();

    if (!trimmedName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name cannot be empty.',
      });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Please provide a valid email address.',
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Prevent duplicate accounts using the same email address
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
    }

    // Hash the password before storing it
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
    });

    const userJson =
      typeof newUser.toJSON === 'function' ? newUser.toJSON() : newUser;

    const jwtSecret = process.env.JWT_SECRET;
    const token = jwtSecret
      ? jwt.sign(
          {
            id: userJson.id || String(userJson._id),
            email: userJson.email,
            name: userJson.name,
          },
          jwtSecret,
          { expiresIn: '24h' }
        )
      : undefined;

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: userJson.id || String(userJson._id),
        name: userJson.name,
        email: userJson.email,
      },
      ...(token ? { token } : {}),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticates a user and returns a signed JWT.
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    const isPasswordValid = await bcrypt.compare(
      String(password),
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'JWT_SECRET is not configured on the server.',
      });
    }

    const userId = user._id ? String(user._id) : user.id;
    const token = jwt.sign(
      {
        id: userId,
        email: user.email,
        name: user.name,
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
};
