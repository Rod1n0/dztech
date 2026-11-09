import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import sampleProducts from '../seed/sampleProducts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_DB_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), 'dztech_local_store.json')
  : path.join(__dirname, '..', 'data', 'local_store.json');

let isConnectedToMongo = false;
let dbInitPromise = null;

/**
 * Loads or initializes the local JSON store used only if a live MongoDB daemon
 * is not reachable in the current environment.
 */
function loadLocalStore() {
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      const raw = fs.readFileSync(FALLBACK_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to initial seed data
  }

  const initialProducts = sampleProducts.map((item) => {
    const doc = new Product(item);
    return doc.toJSON();
  });

  const initialStore = {
    products: initialProducts,
    users: [],
  };
  saveLocalStore(initialStore);
  return initialStore;
}

function saveLocalStore(store) {
  const dir = path.dirname(FALLBACK_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

/**
 * Attaches Mongoose-validated persistence methods to Product and User models
 * if no local or Atlas MongoDB server is reachable.
 */
function enableLocalMongooseFallback() {
  let store = loadLocalStore();

  // --- Product Model Methods ---
  Product.find = async (filter = {}) => {
    store = loadLocalStore();
    let results = [...store.products];
    if (filter.category) {
      results = results.filter((p) => p.category === filter.category);
    }
    return results.map((p) => new Product(p).toJSON());
  };

  Product.findById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const castErr = new mongoose.Error.CastError('ObjectId', id, '_id');
      throw castErr;
    }
    store = loadLocalStore();
    const found = store.products.find(
      (p) => String(p._id) === String(id) || String(p.id) === String(id)
    );
    return found ? new Product(found).toJSON() : null;
  };

  Product.create = async (data) => {
    if (Array.isArray(data)) {
      const created = [];
      for (const item of data) {
        created.push(await Product.create(item));
      }
      return created;
    }
    const doc = new Product(data);
    await doc.validate();
    const json = doc.toJSON();
    store = loadLocalStore();
    store.products.push(json);
    saveLocalStore(store);
    return json;
  };

  Product.findByIdAndUpdate = async (id, updateData, options = {}) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new mongoose.Error.CastError('ObjectId', id, '_id');
    }
    store = loadLocalStore();
    const idx = store.products.findIndex(
      (p) => String(p._id) === String(id) || String(p.id) === String(id)
    );
    if (idx === -1) return null;

    const existing = store.products[idx];
    const merged = {
      ...existing,
      ...updateData,
      _id: existing._id,
    };
    if (updateData.image && !updateData.imageUrl) {
      merged.imageUrl = updateData.image;
    }
    const doc = new Product(merged);
    if (options.runValidators !== false) {
      await doc.validate();
    }
    const updatedJson = doc.toJSON();
    store.products[idx] = updatedJson;
    saveLocalStore(store);
    return updatedJson;
  };

  Product.findByIdAndDelete = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new mongoose.Error.CastError('ObjectId', id, '_id');
    }
    store = loadLocalStore();
    const idx = store.products.findIndex(
      (p) => String(p._id) === String(id) || String(p.id) === String(id)
    );
    if (idx === -1) return null;
    const [deleted] = store.products.splice(idx, 1);
    saveLocalStore(store);
    return deleted;
  };

  Product.countDocuments = async () => {
    store = loadLocalStore();
    return store.products.length;
  };

  Product.deleteMany = async () => {
    store = loadLocalStore();
    store.products = [];
    saveLocalStore(store);
  };

  Product.insertMany = async (items) => {
    store = loadLocalStore();
    const inserted = items.map((item) => {
      const doc = new Product(item);
      const err = doc.validateSync();
      if (err) throw err;
      return doc.toJSON();
    });
    store.products.push(...inserted);
    saveLocalStore(store);
    return inserted;
  };

  // --- User Model Methods ---
  User.findOne = async (query = {}) => {
    store = loadLocalStore();
    const found = store.users.find((u) => {
      if (query.email) {
        return u.email.toLowerCase() === String(query.email).toLowerCase().trim();
      }
      if (query._id) {
        return String(u._id) === String(query._id);
      }
      return false;
    });
    if (!found) return null;
    const doc = new User(found);
    return doc;
  };

  User.findById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new mongoose.Error.CastError('ObjectId', id, '_id');
    }
    store = loadLocalStore();
    const found = store.users.find(
      (u) => String(u._id) === String(id) || String(u.id) === String(id)
    );
    return found ? new User(found) : null;
  };

  User.create = async (data) => {
    store = loadLocalStore();
    const normalizedEmail = String(data.email || '').toLowerCase().trim();
    const duplicate = store.users.find((u) => u.email === normalizedEmail);
    if (duplicate) {
      const dupErr = new Error('Duplicate email address');
      dupErr.code = 11000;
      throw dupErr;
    }
    const doc = new User({
      ...data,
      email: normalizedEmail,
    });
    await doc.validate();
    const rawUser = {
      _id: doc._id.toString(),
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      passwordHash: doc.passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(rawUser);
    saveLocalStore(store);
    return doc;
  };
}

/**
 * Seeds sample products into MongoDB if the products collection is empty.
 */
export async function seedInitialProductsIfNeeded() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(sampleProducts);
    console.log(`[Database] Seeded ${sampleProducts.length} sample products.`);
  }
}

/**
 * Connects to MongoDB using Mongoose (cached across serverless invocations).
 */
export async function connectDB() {
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dztech_ecommerce';

    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3500,
      });
      isConnectedToMongo = true;
      console.log(`[MongoDB] Connected: ${conn.connection.host}`);
      await seedInitialProductsIfNeeded();
      return { mode: 'mongodb', host: conn.connection.host };
    } catch (err) {
      console.warn(
        `[MongoDB] Could not connect to ${mongoUri} (${err.message}).`
      );
      console.log(
        `[MongoDB] Activating Mongoose-validated local persistence store (${FALLBACK_DB_PATH}).`
      );
      enableLocalMongooseFallback();
      await seedInitialProductsIfNeeded();
      return { mode: 'local-mongoose-store', host: 'local_store.json' };
    }
  })();

  return dbInitPromise;
}

export function getDbStatus() {
  return {
    connectedToMongo: isConnectedToMongo || mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
  };
}

export default connectDB;
