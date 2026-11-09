import jwt from 'jsonwebtoken';

/**
 * Middleware to protect routes using JWT or OAuth 2.0 Bearer tokens.
 * Expects header: Authorization: Bearer <TOKEN>
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Missing Authorization header.',
    });
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return res.status(401).json({
      error: 'Unauthorized',
      message:
        'Invalid Authorization header format. Expected: Authorization: Bearer <TOKEN>',
    });
  }

  const token = parts[1].trim();
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Server authentication configuration error (missing JWT_SECRET).',
    });
  }

  // 1. Verify signed JWT (covers standard /api/auth/login JWTs and built-in OAuth 2.0 /api/oauth/token access tokens)
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    return next();
  } catch (jwtError) {
    // 2. Optional external OAuth 2.0 provider introspection (if OAUTH_USERINFO_URL is configured)
    const userInfoUrl = process.env.OAUTH_USERINFO_URL;
    if (userInfoUrl) {
      try {
        const response = await fetch(userInfoUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const oauthProfile = await response.json();
          req.user = {
            id: oauthProfile.sub || oauthProfile.id,
            email: oauthProfile.email,
            name: oauthProfile.name || oauthProfile.login || 'OAuth2 User',
            authProvider: 'oauth2_external',
          };
          return next();
        }
      } catch {
        // Fall through to 401 Unauthorized
      }
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message:
        jwtError.name === 'TokenExpiredError'
          ? 'Authentication token has expired.'
          : 'Invalid or malformed authentication token.',
    });
  }
};

export default authenticateToken;
