import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// In-memory store for short-lived OAuth 2.0 authorization codes (10 min TTL)
const authorizationCodes = new Map();

function base64UrlEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function computeS256Challenge(verifier) {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
}

/**
 * GET /.well-known/openid-configuration
 * OpenID Connect discovery metadata for OAuth 2.0 clients (Postman / Thunder Client).
 */
export const getOpenIdConfiguration = (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.status(200).json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    userinfo_endpoint: `${baseUrl}/api/oauth/userinfo`,
    response_types_supported: ['code'],
    grant_types_supported: [
      'authorization_code',
      'client_credentials',
      'password',
    ],
    code_challenge_methods_supported: ['S256', 'plain'],
    scopes_supported: ['openid', 'profile', 'email', 'products:write'],
    token_endpoint_auth_methods_supported: [
      'client_secret_post',
      'client_secret_basic',
      'none',
    ],
  });
};

/**
 * GET /api/oauth/authorize
 * OAuth 2.0 Authorization Endpoint (supports Authorization Code flow + PKCE).
 */
export const authorizeEndpoint = (req, res) => {
  const {
    response_type = 'code',
    client_id = 'dztech-postman-client',
    redirect_uri = 'https://oauth.pstmn.io/v1/callback',
    scope = 'openid profile email',
    state = '',
    code_challenge = '',
    code_challenge_method = 'S256',
    auto_approve,
  } = req.query;

  if (response_type !== 'code') {
    return res.status(400).json({
      error: 'unsupported_response_type',
      error_description: 'Only response_type=code is supported.',
    });
  }

  // If auto_approve=true or requested via JSON API, issue authorization code immediately
  if (
    auto_approve === 'true' ||
    req.headers.accept?.includes('application/json')
  ) {
    const code = crypto.randomBytes(24).toString('hex');
    authorizationCodes.set(code, {
      clientId: client_id,
      redirectUri: redirect_uri,
      scope,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      user: {
        id: 'oauth2-user-1',
        name: 'DzTech OAuth2 User',
        email: 'oauth@dztech.dz',
      },
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    if (req.headers.accept?.includes('application/json') && !auto_approve) {
      return res.status(200).json({
        code,
        state,
        redirect_uri,
      });
    }

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (state) redirectUrl.searchParams.set('state', state);
    return res.redirect(redirectUrl.toString());
  }

  // Render interactive OAuth 2.0 / OIDC Consent screen for Postman / Thunder Client browser popup
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DzTech OAuth 2.0 & OpenID Connect Sign-In</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0a0a0c;
      color: #f4f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1rem;
    }
    .card {
      background: #121216;
      border: 1px solid #22222a;
      border-radius: 8px;
      max-width: 420px;
      width: 100%;
      padding: 1.75rem;
    }
    h1 { font-size: 1.15rem; margin: 0 0 0.5rem; }
    p { color: #a1a1aa; font-size: 0.85rem; margin: 0 0 1.25rem; line-height: 1.5; }
    .meta {
      background: #18181e;
      border: 1px solid #22222a;
      border-radius: 6px;
      padding: 0.75rem;
      font-size: 0.8rem;
      margin-bottom: 1.25rem;
      color: #a1a1aa;
    }
    .meta strong { color: #f4f4f6; }
    label { display: block; font-size: 0.8rem; margin-bottom: 0.35rem; color: #a1a1aa; }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.55rem 0.75rem;
      margin-bottom: 0.85rem;
      background: #0a0a0c;
      border: 1px solid #22222a;
      border-radius: 6px;
      color: #f4f4f6;
      font-size: 0.85rem;
    }
    button {
      width: 100%;
      padding: 0.65rem;
      background: #f4f4f6;
      color: #0a0a0c;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
    }
    button:hover { background: #dcdce0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>DzTech OAuth 2.0 Authorization</h1>
    <p>An application is requesting access to your DzTech Store account via OpenID Connect / OAuth 2.0.</p>
    <div class="meta">
      <div><strong>Client ID:</strong> ${String(client_id).replace(/[<>"']/g, '')}</div>
      <div><strong>Requested Scope:</strong> ${String(scope).replace(/[<>"']/g, '')}</div>
      <div><strong>PKCE Challenge:</strong> ${code_challenge ? `${String(code_challenge_method).replace(/[<>"']/g, '')} enabled` : 'None'}</div>
    </div>
    <form method="POST" action="/api/oauth/authorize">
      <input type="hidden" name="client_id" value="${String(client_id).replace(/[<>"']/g, '')}" />
      <input type="hidden" name="redirect_uri" value="${String(redirect_uri).replace(/[<>"']/g, '')}" />
      <input type="hidden" name="scope" value="${String(scope).replace(/[<>"']/g, '')}" />
      <input type="hidden" name="state" value="${String(state).replace(/[<>"']/g, '')}" />
      <input type="hidden" name="code_challenge" value="${String(code_challenge).replace(/[<>"']/g, '')}" />
      <input type="hidden" name="code_challenge_method" value="${String(code_challenge_method).replace(/[<>"']/g, '')}" />
      <label for="email">Email (optional — leave default for demo OAuth user)</label>
      <input id="email" name="email" type="email" value="oauth@dztech.dz" required />
      <button type="submit">Authorize &amp; Continue</button>
    </form>
  </div>
</body>
</html>`);
};

/**
 * POST /api/oauth/authorize
 * Handles user consent submission and redirects back to redirect_uri with authorization code.
 */
export const approveAuthorization = async (req, res) => {
  const {
    client_id = 'dztech-postman-client',
    redirect_uri = 'https://oauth.pstmn.io/v1/callback',
    scope = 'openid profile email',
    state = '',
    code_challenge = '',
    code_challenge_method = 'S256',
    email = 'oauth@dztech.dz',
  } = req.body || {};

  if (!redirect_uri) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'redirect_uri is required.',
    });
  }

  let userInfo = {
    id: 'oauth2-user-1',
    name: 'DzTech OAuth2 User',
    email: String(email).toLowerCase().trim(),
  };

  try {
    const existing = await User.findOne({ email: userInfo.email });
    if (existing) {
      userInfo = {
        id: String(existing._id || existing.id),
        name: existing.name,
        email: existing.email,
      };
    }
  } catch {
    // Keep default OAuth2 user profile
  }

  const code = crypto.randomBytes(24).toString('hex');
  authorizationCodes.set(code, {
    clientId: client_id,
    redirectUri: redirect_uri,
    scope,
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method,
    user: userInfo,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  if (req.headers.accept?.includes('application/json')) {
    return res.status(200).json({
      code,
      state,
      redirect_uri,
    });
  }

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);
  return res.redirect(redirectUrl.toString());
};

/**
 * POST /api/oauth/token
 * Exchanges an Authorization Code (+ PKCE verifier), Client Credentials, or Password for an OAuth 2.0 Bearer Access Token.
 */
export const tokenEndpoint = async (req, res) => {
  const {
    grant_type = 'authorization_code',
    code,
    redirect_uri,
    client_id,
    code_verifier,
    username,
    email,
    password,
    scope = 'openid profile email products:write',
  } = req.body || {};

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({
      error: 'server_error',
      error_description: 'JWT_SECRET is not configured on the server.',
    });
  }

  // 1. Authorization Code Grant (with optional PKCE verification)
  if (grant_type === 'authorization_code') {
    if (!code) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Authorization code is required.',
      });
    }

    const stored = authorizationCodes.get(code);
    if (!stored || stored.expiresAt < Date.now()) {
      authorizationCodes.delete(code);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code is invalid or has expired.',
      });
    }

    if (redirect_uri && stored.redirectUri && redirect_uri !== stored.redirectUri) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'redirect_uri does not match the registered authorization request.',
      });
    }

    // Verify PKCE code_verifier if code_challenge was provided during authorization
    if (stored.codeChallenge) {
      if (!code_verifier) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'PKCE code_verifier is required for this authorization code.',
        });
      }

      const method = (stored.codeChallengeMethod || 'S256').toUpperCase();
      const computed =
        method === 'S256'
          ? computeS256Challenge(code_verifier)
          : code_verifier;

      if (computed !== stored.codeChallenge) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'PKCE code_verifier validation failed.',
        });
      }
    }

    // Single-use authorization code
    authorizationCodes.delete(code);

    const payload = {
      sub: stored.user.id,
      id: stored.user.id,
      name: stored.user.name,
      email: stored.user.email,
      scope: stored.scope || scope,
      client_id: client_id || stored.clientId,
      auth_method: 'oauth2_authorization_code',
    };

    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    const idToken = jwt.sign(
      {
        ...payload,
        aud: client_id || stored.clientId,
        iss: `${req.protocol}://${req.get('host')}`,
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: stored.scope || scope,
      id_token: idToken,
    });
  }

  // 2. Client Credentials Grant
  if (grant_type === 'client_credentials') {
    const resolvedClientId =
      client_id || process.env.OAUTH_CLIENT_ID || 'dztech-oauth-client';
    const payload = {
      sub: resolvedClientId,
      id: resolvedClientId,
      name: 'OAuth2 Service Client',
      email: 'client@dztech.dz',
      scope,
      auth_method: 'oauth2_client_credentials',
    };
    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    return res.status(200).json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope,
    });
  }

  // 3. Resource Owner Password Credentials Grant
  if (grant_type === 'password') {
    const loginEmail = String(username || email || '').toLowerCase().trim();
    if (!loginEmail || !password) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'username/email and password are required.',
      });
    }

    const user = await User.findOne({ email: loginEmail });
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: 'Invalid user credentials.',
      });
    }

    const userId = String(user._id || user.id);
    const payload = {
      sub: userId,
      id: userId,
      name: user.name,
      email: user.email,
      scope,
      auth_method: 'oauth2_password',
    };
    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    return res.status(200).json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope,
    });
  }

  return res.status(400).json({
    error: 'unsupported_grant_type',
    error_description: `Grant type "${grant_type}" is not supported.`,
  });
};

/**
 * GET /api/oauth/userinfo
 * OpenID Connect UserInfo endpoint returning claims for the Bearer token.
 */
export const userInfoEndpoint = (req, res) => {
  res.status(200).json({
    sub: req.user.sub || req.user.id,
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    scope: req.user.scope || 'openid profile email',
  });
};
