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
│   ├── .env.example              # Environment variable template
│   ├── package.json              # Backend package configuration
│   └── server.js                 # Express application entry point
├── src/                          # React + Redux frontend source
│   ├── components/               # Navbar, ProductList, ProductCard, Cart, AuthModal, ProductFormModal
│   ├── redux/                    # Redux store, actions, and cart reducer
│   └── services/api.js           # REST API client with JWT Bearer header injection
├── .env.example                  # Root environment variable template
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

### 3. Start the Backend REST API Server
```bash
npm run server
```
The API will start on `http://localhost:3000`.

### 4. Start the React Frontend (in a second terminal)
```bash
npm run dev
```
The React application will start on `http://localhost:5173` and automatically connect to `http://localhost:3000/api`.
