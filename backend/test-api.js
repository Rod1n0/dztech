import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import oauthRoutes from './routes/oauthRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { getOpenIdConfiguration } from './controllers/oauthController.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  const localStorePath = path.resolve(__dirname, 'data', 'local_store.json');
  const backupStore = fs.existsSync(localStorePath)
    ? fs.readFileSync(localStorePath, 'utf-8')
    : null;

  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.get('/.well-known/openid-configuration', getOpenIdConfiguration);
  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/oauth', oauthRoutes);
  app.use('/api/products', productRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`\n=== Running TD-TP 3 REST API Verification Suite on ${baseUrl} ===\n`);

  try {
    const uniqueEmail = `student_${Date.now()}@ensta.edu.dz`;

    // 1. Register a new user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Farouk Boudissa',
        email: uniqueEmail,
        password: 'SecurePassword123!',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, `Expected 201 on register, got ${regRes.status}`);
    console.log('[PASS] 1. Register new user -> 201 Created', regData.user);

    // 2. Attempt to register with an existing email
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: uniqueEmail,
        password: 'SecurePassword123!',
      }),
    });
    assert(dupRes.status === 409, `Expected 409 on duplicate email, got ${dupRes.status}`);
    console.log('[PASS] 2. Register with existing email -> 409 Conflict');

    // 3. Log in with valid credentials & receive JWT
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'SecurePassword123!',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.token, `Expected 200 & JWT, got ${loginRes.status}`);
    const jwtToken = loginData.token;
    console.log('[PASS] 3. Login with valid credentials -> 200 OK & JWT received');

    // 4. Attempt to log in with invalid credentials
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'WrongPassword',
      }),
    });
    assert(badLoginRes.status === 401, `Expected 401 on invalid login, got ${badLoginRes.status}`);
    console.log('[PASS] 4. Login with invalid credentials -> 401 Unauthorized');

    // 5. Retrieve the product list
    const listRes = await fetch(`${baseUrl}/api/products`);
    const listData = await listRes.json();
    assert(listRes.status === 200 && Array.isArray(listData) && listData.length > 0, 'Expected product array');
    console.log(`[PASS] 5. Retrieve product list -> 200 OK (${listData.length} products)`);

    // 6. Retrieve a single product by ID
    const sampleId = listData[0]._id || listData[0].id;
    const singleRes = await fetch(`${baseUrl}/api/products/${sampleId}`);
    const singleData = await singleRes.json();
    assert(singleRes.status === 200 && singleData.name, `Expected 200 on single product, got ${singleRes.status}`);
    console.log(`[PASS] 6. Retrieve single product (${sampleId}) -> 200 OK (${singleData.name})`);

    // 7. Attempt protected request without token
    const noTokenRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unauthorized Laptop',
        description: 'Should fail without token',
        price: 150000,
        category: 'Laptops',
        imageUrl: 'https://example.com/img.jpg',
        stock: 5,
      }),
    });
    assert(noTokenRes.status === 401, `Expected 401 without token, got ${noTokenRes.status}`);
    console.log('[PASS] 7. Protected request without token -> 401 Unauthorized');

    // 8. Attempt protected request with invalid token
    const badTokenRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.jwt.token.value',
      },
      body: JSON.stringify({
        name: 'Invalid Token Laptop',
        description: 'Should fail with invalid token',
        price: 150000,
        category: 'Laptops',
        imageUrl: 'https://example.com/img.jpg',
        stock: 5,
      }),
    });
    assert(badTokenRes.status === 401, `Expected 401 with invalid token, got ${badTokenRes.status}`);
    console.log('[PASS] 8. Protected request with invalid token -> 401 Unauthorized');

    // 9. Create a product with a valid JWT token
    const createRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        name: 'Apple MacBook Pro 14 M3 Pro',
        description: '14-inch Liquid Retina XDR laptop powered by Apple M3 Pro chip.',
        price: 385000,
        category: 'Laptops',
        specs: 'M3 Pro · 18GB Unified · 512GB NVMe',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        stock: 7,
      }),
    });
    const createdProd = await createRes.json();
    assert(createRes.status === 201 && (createdProd._id || createdProd.id), `Expected 201 on create, got ${createRes.status}`);
    const createdId = createdProd._id || createdProd.id;
    console.log(`[PASS] 9. Create product with valid JWT -> 201 Created (ID: ${createdId})`);

    // 10. Update a product with a valid JWT token
    const updateRes = await fetch(`${baseUrl}/api/products/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        price: 372000,
        stock: 10,
      }),
    });
    const updatedProd = await updateRes.json();
    assert(updateRes.status === 200 && updatedProd.price === 372000, `Expected 200 on update, got ${updateRes.status}`);
    console.log(`[PASS] 10. Update product with valid JWT -> 200 OK (New price: ${updatedProd.price} DZD)`);

    // 11. Delete a product with a valid JWT token
    const deleteRes = await fetch(`${baseUrl}/api/products/${createdId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    assert(deleteRes.status === 200, `Expected 200 on delete, got ${deleteRes.status}`);
    console.log(`[PASS] 11. Delete product with valid JWT -> 200 OK`);

    // 12. Test an invalid product ID (400 Bad Request) & non-existent ID (404 Not Found)
    const invalidIdRes = await fetch(`${baseUrl}/api/products/not-a-valid-mongo-id`);
    assert(invalidIdRes.status === 400, `Expected 400 on invalid ID, got ${invalidIdRes.status}`);
    const notFoundRes = await fetch(`${baseUrl}/api/products/65f999999999999999999999`);
    assert(notFoundRes.status === 404, `Expected 404 on missing ID, got ${notFoundRes.status}`);
    console.log('[PASS] 12. Invalid product ID -> 400 Bad Request & Non-existent ID -> 404 Not Found');

    // 13. Test missing or invalid product information
    const invalidProdRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        name: 'Incomplete Product',
      }),
    });
    assert(invalidProdRes.status === 400, `Expected 400 on missing product fields, got ${invalidProdRes.status}`);
    console.log('[PASS] 13. Missing/invalid product fields -> 400 Bad Request');

    // 14. Test OAuth 2.0 Authorization Code Flow with PKCE (Section 8)
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const oauthAuthRes = await fetch(
      `${baseUrl}/api/oauth/authorize?response_type=code&client_id=postman-client&redirect_uri=https://oauth.pstmn.io/v1/callback&code_challenge=${codeChallenge}&code_challenge_method=S256`,
      { headers: { Accept: 'application/json' } }
    );
    const oauthAuthData = await oauthAuthRes.json();
    assert(oauthAuthRes.status === 200 && oauthAuthData.code, 'Expected OAuth2 authorization code');

    const oauthTokenRes = await fetch(`${baseUrl}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: oauthAuthData.code,
        redirect_uri: 'https://oauth.pstmn.io/v1/callback',
        client_id: 'postman-client',
        code_verifier: codeVerifier,
      }),
    });
    const oauthTokenData = await oauthTokenRes.json();
    assert(
      oauthTokenRes.status === 200 && oauthTokenData.access_token,
      `Expected OAuth2 access_token, got ${oauthTokenRes.status}`
    );
    console.log('[PASS] 14. OAuth 2.0 Authorization Code + PKCE flow -> 200 OK & Bearer access_token issued');

    // 15. Test Login Rate Limiting (Max 5 requests per 15 minutes -> 6th request returns 429)
    let rateLimitStatus = 200;
    for (let i = 0; i < 5; i++) {
      const rlRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: uniqueEmail,
          password: 'WrongPassword',
        }),
      });
      rateLimitStatus = rlRes.status;
    }
    assert(rateLimitStatus === 429, `Expected 429 Too Many Requests after exceeding 5 login requests, got ${rateLimitStatus}`);
    console.log('[PASS] 15. Login Rate Limiting (> 5 requests / 15 min) -> 429 Too Many Requests');

    console.log('\n=== ALL 15 TD-TP 3 BACKEND TESTS PASSED SUCCESSFULLY ===\n');
  } finally {
    if (backupStore !== null) {
      fs.writeFileSync(localStorePath, backupStore, 'utf-8');
    }
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n[FAIL]', err);
  process.exit(1);
});
