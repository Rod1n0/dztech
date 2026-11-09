# DzTech Store: Full-Stack E-Commerce Application (TD-TP 3)

## 1. Student Information
- **Student Name:** BOUDISSA Farouk Radouane
- **Institution:** Higher National School of Advanced Technologies (ENSTA)
- **Module:** WAMD (Web & Mobile Application Development)
- **Assignment:** TD–TP 3: Build an E-Commerce Backend: REST API with Node.js, Express.js, MongoDB, JWT, OAuth2, and Rate Limiting

---

## 2. Application Description
**DzTech Store** is a full-stack e-commerce web application for computer hardware and peripherals (laptops, monitors, keyboards, mice, audio gear, and PC components).

- **Backend (TD–TP 3):** Provides a RESTful API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**. It manages persistent product catalog CRUD operations, user account registration with `bcryptjs` password hashing, **JWT** authentication, **OAuth 2.0 / OpenID Connect (Authorization Code + PKCE)** token authentication, and API security via **`express-rate-limit`**.
- **Frontend (TD–TP 2 + TD–TP 3 Integration):** Built with **React.js** and **Redux**. It consumes the Express REST API to display live product inventory, allows users to register and sign in to obtain a JWT, enables authenticated users to create, update, and delete products directly from the interface, and manages a persistent shopping cart via Redux.

---

## 3. Technologies Used

| Tool / Technology | Purpose |
| :--- | :--- |
| **Node.js** | Backend JavaScript runtime environment |
| **Express.js** | Web framework for building the REST API |
| **MongoDB / MongoDB Atlas** | NoSQL document database for storing products and users |
| **Mongoose** | Object Data Modeling (ODM) library for MongoDB |
| **JSON Web Token (`jsonwebtoken`)** | Stateless JWT generation and verification |
| **OAuth 2.0 / OpenID Connect** | Authorization Code flow with PKCE (`S256`) & Bearer token support |
| **`bcryptjs`** | Secure one-way password salting and hashing |
| **`express-rate-limit`** | Rate limiting middleware to prevent abuse and brute-force login attempts |
| **`dotenv` & `cors`** | Environment variable management and Cross-Origin Resource Sharing |
| **React.js + Redux (Vite)** | Frontend user interface and shopping cart state management |
| **Postman / Thunder Client** | REST API, JWT, OAuth 2.0, and rate-limit testing |

---

## 4. Project Structure

```text
dztech/
├── api/
│   └── index.js                  # Vercel Serverless Function entry point
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Mongoose connection & auto-seeding
│   ├── controllers/
│   │   ├── authController.js     # User registration & login controllers
│   │   ├── oauthController.js    # OAuth 2.0 / OIDC (Authorization Code + PKCE) controllers
│   │   └── productController.js  # Product CRUD controllers
│   ├── middleware/
│   │   ├── auth.js               # JWT & OAuth 2.0 Bearer token verification middleware
│   │   ├── errorHandler.js       # Centralized HTTP error & status code handler
│   │   └── rateLimiter.js        # General API (100/15m) & Login (5/15m) rate limiters
│   ├── models/
│   │   ├── Product.js            # Mongoose Product schema & model
│   │   └── User.js               # Mongoose User schema & model
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   ├── oauthRoutes.js        # /api/oauth routes
│   │   └── productRoutes.js      # /api/products routes
│   ├── seed/
│   │   ├── sampleProducts.js     # Initial sample hardware catalog
│   │   └── seedProducts.js       # Database seeding script
│   ├── DzTech_Postman_Collection.json       # Ready-to-import Postman v2.1 collection
│   ├── DzTech_ThunderClient_Collection.json # Ready-to-import Thunder Client collection
│   ├── .env.example              # Environment variable template
│   ├── server.js                 # Express application entry point
│   ├── start-all.js              # Full-stack concurrent launcher (Backend + Frontend)
│   └── test-api.js               # Automated 15-check REST API verification suite
├── src/                          # React + Redux frontend source
│   ├── components/               # Navbar, ProductList, ProductCard, Cart, AuthModal, ProductFormModal
│   ├── redux/                    # Redux store, actions, and cart reducer
│   └── services/api.js           # REST API client with JWT Bearer header injection
├── .env.example                  # Root environment variable template
├── vercel.json                   # Vercel full-stack build & API routing configuration
└── package.json                  # Project scripts & dependencies
```

---

## 5. Database Models

### Product Model (`backend/models/Product.js`)
Represents an item available in the store:
- `name` (`String`, required): Product name.
- `description` (`String`, required): Detailed product overview.
- `price` (`Number`, required, `min: 0`): Product price in DZD.
- `category` (`String`, required): Hardware category (`Laptops`, `Monitors`, `Peripherals`, `Audio`, `Components`).
- `imageUrl` (`String`, required): URL of the product image.
- `stock` (`Number`, required, `min: 0`, default `10`): Available quantity in stock.
- `specs` (`String`, optional): Hardware specification summary string.
- `originalPrice` (`Number`, optional): Previous price for discount calculation.

### User Model (`backend/models/User.js`)
Represents a registered customer:
- `name` (`String`, required): Full name of the user.
- `email` (`String`, required, `unique`, lowercase): Unique email address validated by regex.
- `passwordHash` (`String`, required): `bcryptjs` salted hash of the user's password (plain-text passwords are never stored or returned).

---

## 6. API Endpoints and Access Requirements

### Authentication Endpoints

| Method | Endpoint | Purpose | Access | Rate Limit |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account | Public | 100 req / 15 min |
| `POST` | `/api/auth/login` | Authenticate user and return a JWT | Public | **5 req / 15 min per IP** |
| `GET` | `/api/auth/me` | Retrieve current authenticated user profile | JWT / OAuth2 Required | 100 req / 15 min |

### Product Endpoints

| Method | Endpoint | Purpose | Access | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Retrieve all products | Public | `200 OK` |
| `GET` | `/api/products/:id` | Retrieve one product by ID | Public | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/api/products` | Create a new product | **JWT / OAuth2 Required** | `201 Created`, `400 Bad Request`, `401 Unauthorized` |
| `PUT` | `/api/products/:id` | Update an existing product | **JWT / OAuth2 Required** | `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |
| `DELETE` | `/api/products/:id` | Delete a product | **JWT / OAuth2 Required** | `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |

### OAuth 2.0 / OpenID Connect Endpoints (For Postman / Thunder Client)

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/.well-known/openid-configuration` | OpenID Connect Discovery metadata |
| `GET / POST` | `/api/oauth/authorize` | OAuth 2.0 Authorization Endpoint (Authorization Code + PKCE `S256`) |
| `POST` | `/api/oauth/token` | OAuth 2.0 Token Endpoint (`authorization_code`, `client_credentials`, `password`) |
| `GET` | `/api/oauth/userinfo` | OpenID Connect UserInfo Endpoint (`Bearer <ACCESS_TOKEN>`) |

---

## 7. JWT & OAuth 2.0 Authentication Mechanism

1. **User Registration (`POST /api/auth/register`):**
   - Validates `name`, `email`, and `password`.
   - Checks MongoDB for existing email addresses and returns `409 Conflict` on duplicates.
   - Hashes the password with `bcryptjs` (`10` salt rounds) and saves `passwordHash` in MongoDB.
2. **User Login (`POST /api/auth/login`):**
   - Verifies the user's email and compares the submitted password with `passwordHash` using `bcrypt.compare()`.
   - Generates a signed JWT containing `{ id, email, name }` using `process.env.JWT_SECRET` (expires in `24h`).
3. **Protecting Endpoints (`backend/middleware/auth.js`):**
   - Clients send the token in the HTTP header:
     ```http
     Authorization: Bearer <JWT_OR_OAUTH2_ACCESS_TOKEN>
     ```
   - The `authenticateToken` middleware extracts the token, verifies its signature and expiration against `process.env.JWT_SECRET` (or validates against a configured OAuth 2.0 UserInfo endpoint), attaches `req.user`, and calls `next()`.
   - If the token is missing, malformed, or invalid, the middleware immediately rejects the request with `401 Unauthorized`.
4. **OAuth 2.0 in Postman / Thunder Client:**
   - Select **OAuth 2.0** as the Authorization type.
   - Set **Grant Type** to `Authorization Code (With PKCE)`.
   - **Auth URL:** `http://localhost:3000/api/oauth/authorize`
   - **Access Token URL:** `http://localhost:3000/api/oauth/token`
   - **Client ID:** `dztech-postman-client`
   - **Code Challenge Method:** `SHA-256` (`S256`)
   - Obtain the access token and send requests to `POST / PUT / DELETE /api/products` with `Authorization: Bearer <ACCESS_TOKEN>`.

---

## 8. Configuring MongoDB and Environment Variables

Create a `.env` file in the root directory (or `backend/.env`) based on `.env.example`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/dztech_ecommerce
JWT_SECRET=replace_with_a_local_secret
```

- **Local MongoDB Community Server:** Use `mongodb://127.0.0.1:27017/dztech_ecommerce`.
- **MongoDB Atlas:** Replace `MONGODB_URI` with your Atlas connection string (`mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dztech_ecommerce?retryWrites=true&w=majority`).
- The `.env` file is excluded via `.gitignore` so credentials and secrets are never committed to Git.

---

## 9. Installing Dependencies and Running the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Sample Products (Optional — auto-seeds on first startup)
```bash
npm run seed
```

### 3. Run Both Backend and Frontend Together (Single Terminal)
```bash
npm run dev:full
```
- **Backend REST API:** `http://localhost:3000`
- **React Frontend:** `http://localhost:5173`

### 4. Or Run Backend and Frontend in Separate Terminals
```bash
# Terminal 1 — Start Express REST API on http://localhost:3000
npm run server

# Terminal 2 — Start Vite React Frontend on http://localhost:5173
npm run dev
```

### 5. API Testing (Postman, Thunder Client & Automated Suite)
- **Automated Verification Suite (15 checks):**
  ```bash
  npm run test:api
  ```
- **Postman Collection:** Import `backend/DzTech_Postman_Collection.json` into Postman.
- **Thunder Client Collection:** Import `backend/DzTech_ThunderClient_Collection.json` into Thunder Client in VS Code.

---

## 10. Cloud Deployment (Vercel + MongoDB Atlas)

The project is pre-configured via `vercel.json` and `api/index.js` to deploy both the Vite React frontend and the Express REST API on **Vercel**:
1. Import the GitHub repository on Vercel (Framework Preset: **Vite**).
2. In **Settings -> Environment Variables**, configure:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: Your production secret key.
3. Deploy — `/api/*` and `/.well-known/openid-configuration` requests are routed to the Express backend while `/` serves the React frontend.
