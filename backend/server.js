import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import connectDB, { getDbStatus } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import oauthRoutes from './routes/oauthRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { getOpenIdConfiguration } from './controllers/oauthController.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for React development origin and API testing tools
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse JSON and URL-encoded bodies (URL-encoded is used by OAuth 2.0 token requests)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure database connection is initialized (supports both standalone server and Vercel serverless)
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// OpenID Connect discovery endpoint
app.get('/.well-known/openid-configuration', getOpenIdConfiguration);

// Apply general API rate limiting (100 requests per 15 minutes per IP)
app.use('/api', apiLimiter);

// API Health / Root info
app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'DzTech E-Commerce REST API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login', '/api/auth/me'],
      oauth2: [
        '/.well-known/openid-configuration',
        '/api/oauth/authorize',
        '/api/oauth/token',
        '/api/oauth/userinfo',
      ],
      products: ['/api/products', '/api/products/:id'],
    },
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    database: getDbStatus(),
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/products', productRoutes);

// 404 and centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to database and start server
async function startServer() {
  const dbInfo = await connectDB();
  const server = app.listen(PORT, (err) => {
    if (err) {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `[Server] Port ${PORT} is already in use (another server instance is already running on http://localhost:${PORT}).`
        );
      } else {
        console.error('[Server] Failed to start server:', err.message);
      }
      process.exit(1);
    }
    console.log(
      `[Server] DzTech E-Commerce API running on http://localhost:${PORT} (DB mode: ${dbInfo.mode})`
    );
  });
  return server;
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
