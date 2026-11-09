import express from 'express';
import {
  authorizeEndpoint,
  approveAuthorization,
  tokenEndpoint,
  userInfoEndpoint,
} from '../controllers/oauthController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// OAuth 2.0 Authorization Endpoint (Authorization Code + PKCE)
router.get('/authorize', authorizeEndpoint);
router.post('/authorize', approveAuthorization);

// OAuth 2.0 Token Endpoint
router.post('/token', tokenEndpoint);

// OpenID Connect UserInfo Endpoint
router.get('/userinfo', authenticateToken, userInfoEndpoint);

export default router;
