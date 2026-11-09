import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import fallbackProducts from '../data/products';
import ProductCard from './ProductCard';
import ProductFormModal from './ProductFormModal';
import { addToCart } from '../redux/actions';
import api from '../services/api';

const ProductList = ({ user, token }) => {
  const dispatch = useDispatch();

  const [products, setProducts] = useState(fallbackProducts);
  const [apiConnected, setApiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [inspectedProduct, setInspectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getProducts()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          const normalized = data.map((p) => ({
            ...p,
            id: p.id || p._id,
            image: p.imageUrl || p.image,
            imageUrl: p.imageUrl || p.image,
          }));
          setProducts(normalized);
          setApiConnected(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts(fallbackProducts);
          setApiConnected(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ['All', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory =
          selectedCategory === 'All' || product.category === selectedCategory;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          (product.name && product.name.toLowerCase().includes(query)) ||
          (product.specs && product.specs.toLowerCase().includes(query)) ||
          (product.description &&
            product.description.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return String(a.id || a._id).localeCompare(String(b.id || b._id));
      });
  }, [products, searchQuery, selectedCategory, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('featured');
  };

  const handleCreateProduct = async (productPayload) => {
    const created = await api.createProduct(productPayload, token);
    const normalized = {
      ...created,
      id: created.id || created._id,
      image: created.imageUrl || created.image,
    };
    setProducts((prev) => [...prev, normalized]);
    setStatusMessage(`Created "${normalized.name}" via POST /api/products`);
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleUpdateProduct = async (productPayload) => {
    const targetId = editingProduct.id || editingProduct._id;
    const updated = await api.updateProduct(targetId, productPayload, token);
    const normalized = {
      ...updated,
      id: updated.id || updated._id,
      image: updated.imageUrl || updated.image,
    };
    setProducts((prev) =>
      prev.map((p) => ((p.id || p._id) === targetId ? normalized : p))
    );
    setInspectedProduct(null);
    setStatusMessage(`Updated "${normalized.name}" via PUT /api/products/${targetId}`);
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleDeleteProduct = async (product) => {
    const targetId = product.id || product._id;
    await api.deleteProduct(targetId, token);
    setProducts((prev) => prev.filter((p) => (p.id || p._id) !== targetId));
    setInspectedProduct(null);
    setStatusMessage(`Deleted "${product.name}" via DELETE /api/products/${targetId}`);
    setTimeout(() => setStatusMessage(''), 4000);
  };

  return (
    <section className="catalog-section">
      <div className="catalog-header">
        <div>
          <h1 className="catalog-title">Hardware &amp; Peripherals</h1>
          <p className="catalog-subtitle">
            Curated laptops, monitors, keyboards, and components.
          </p>
        </div>
        <div className="catalog-header-meta">
          <span className="api-status-badge">
            <span
              className={`api-dot ${apiConnected ? 'online' : 'offline'}`}
            />
            {loading
              ? 'Syncing API...'
              : apiConnected
                ? 'REST API Connected'
                : 'Local Fallback'}
          </span>
          {user && (
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
            >
              + New Product
            </button>
          )}
          <span className="catalog-count">
            {filteredProducts.length} of {products.length} items
          </span>
        </div>
      </div>

      {statusMessage && <div className="status-banner">{statusMessage}</div>}

      <div className="toolbar">
        <div className="search-field">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search laptops, monitors, specs..."
            aria-label="Search products"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </button>
          )}
        </div>

        <div className="toolbar-controls">
          <div className="category-tabs" role="tablist">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`category-tab ${
                  selectedCategory === category ? 'active' : ''
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="sort-control">
            <label htmlFor="sort-select" className="sort-label">
              Sort
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id || product._id}
              product={product}
              onSelectProduct={setInspectedProduct}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No matching products</h3>
          <p>Try a different search term or reset your active filters.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        </div>
      )}

      {inspectedProduct && (
        <div
          className="modal-backdrop"
          onClick={() => setInspectedProduct(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-category">
                  {inspectedProduct.category}
                  {inspectedProduct.stock !== undefined &&
                    ` · Stock: ${inspectedProduct.stock}`}
                </span>
                <h2 className="modal-title">{inspectedProduct.name}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setInspectedProduct(null)}
              >
                Close
              </button>
            </div>

            <div className="modal-body">
              {inspectedProduct.specs && (
                <div className="modal-spec-block">
                  <h4>Specifications</h4>
                  <p>{inspectedProduct.specs}</p>
                </div>
              )}
              <div className="modal-spec-block">
                <h4>Overview</h4>
                <p>{inspectedProduct.description}</p>
              </div>
              <div className="modal-price-row">
                <span>Price</span>
                <strong>
                  {Number(inspectedProduct.price).toLocaleString('fr-DZ')} DZD
                </strong>
              </div>
            </div>

            <div className="modal-footer">
              {user && (
                <>
                  <button
                    type="button"
                    className="btn-danger-outline"
                    onClick={() => handleDeleteProduct(inspectedProduct)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingProduct(inspectedProduct);
                      setInspectedProduct(null);
                    }}
                  >
                    Edit
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setInspectedProduct(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  dispatch(
                    addToCart({
                      ...inspectedProduct,
                      id: inspectedProduct.id || inspectedProduct._id,
                      image:
                        inspectedProduct.imageUrl || inspectedProduct.image,
                    })
                  );
                  setInspectedProduct(null);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <ProductFormModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateProduct}
        />
      )}

      {editingProduct && (
        <ProductFormModal
          initialProduct={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleUpdateProduct}
        />
      )}
    </section>
  );
};

export default ProductList;
