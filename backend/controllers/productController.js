import mongoose from 'mongoose';
import Product from '../models/Product.js';

/**
 * GET /api/products
 * Retrieves all products from the database.
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }

    const products = await Product.find(filter);
    return res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 * Retrieves a single product by its MongoDB ObjectId.
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid product ID format: "${id}".`,
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with ID "${id}" was not found.`,
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products
 * Creates a new product (Protected: requires JWT or OAuth2 Bearer token).
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      category,
      specs,
      imageUrl,
      image,
      stock,
    } = req.body || {};

    const resolvedImageUrl = imageUrl || image;

    if (
      !name ||
      !description ||
      price === undefined ||
      price === null ||
      price === '' ||
      !category ||
      !resolvedImageUrl
    ) {
      return res.status(400).json({
        error: 'Bad Request',
        message:
          'Missing required product fields. Required: name, description, price, category, and imageUrl.',
      });
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Product price must be a valid non-negative number.',
      });
    }

    const numericStock =
      stock !== undefined && stock !== null && stock !== ''
        ? Number(stock)
        : 10;

    if (Number.isNaN(numericStock) || numericStock < 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Product stock must be a valid non-negative number.',
      });
    }

    const numericOriginalPrice =
      originalPrice !== undefined &&
      originalPrice !== null &&
      originalPrice !== ''
        ? Number(originalPrice)
        : null;

    const createdProduct = await Product.create({
      name: String(name).trim(),
      description: String(description).trim(),
      price: numericPrice,
      originalPrice: numericOriginalPrice,
      category: String(category).trim(),
      specs: specs ? String(specs).trim() : '',
      imageUrl: String(resolvedImageUrl).trim(),
      stock: numericStock,
    });

    return res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id
 * Updates an existing product by ID (Protected: requires JWT or OAuth2 Bearer token).
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid product ID format: "${id}".`,
      });
    }

    const body = req.body || {};
    if (Object.keys(body).length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Update payload cannot be empty.',
      });
    }

    const updateData = {};

    if (body.name !== undefined) {
      if (!String(body.name).trim()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Product name cannot be empty.',
        });
      }
      updateData.name = String(body.name).trim();
    }

    if (body.description !== undefined) {
      if (!String(body.description).trim()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Product description cannot be empty.',
        });
      }
      updateData.description = String(body.description).trim();
    }

    if (body.price !== undefined) {
      const numericPrice = Number(body.price);
      if (
        body.price === null ||
        body.price === '' ||
        Number.isNaN(numericPrice) ||
        numericPrice < 0
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Product price must be a valid non-negative number.',
        });
      }
      updateData.price = numericPrice;
    }

    if (body.originalPrice !== undefined) {
      updateData.originalPrice =
        body.originalPrice === null || body.originalPrice === ''
          ? null
          : Number(body.originalPrice);
    }

    if (body.category !== undefined) {
      if (!String(body.category).trim()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Product category cannot be empty.',
        });
      }
      updateData.category = String(body.category).trim();
    }

    if (body.specs !== undefined) {
      updateData.specs = String(body.specs).trim();
    }

    if (body.imageUrl !== undefined || body.image !== undefined) {
      const resolvedImg = body.imageUrl ?? body.image;
      if (!String(resolvedImg).trim()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Product imageUrl cannot be empty.',
        });
      }
      updateData.imageUrl = String(resolvedImg).trim();
    }

    if (body.stock !== undefined) {
      const numericStock = Number(body.stock);
      if (
        body.stock === null ||
        body.stock === '' ||
        Number.isNaN(numericStock) ||
        numericStock < 0
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Product stock must be a valid non-negative number.',
        });
      }
      updateData.stock = numericStock;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with ID "${id}" was not found.`,
      });
    }

    return res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 * Deletes a product by ID (Protected: requires JWT or OAuth2 Bearer token).
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid product ID format: "${id}".`,
      });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Product with ID "${id}" was not found.`,
      });
    }

    return res.status(200).json({
      message: 'Product deleted successfully.',
      product: deletedProduct,
    });
  } catch (error) {
    next(error);
  }
};
