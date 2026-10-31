import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import products from '../data/products';
import ProductCard from './ProductCard';
import { addToCart } from '../redux/actions';

const ProductList = () => {
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [inspectedProduct, setInspectedProduct] = useState(null);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ['All', ...unique];
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory =
          selectedCategory === 'All' || product.category === selectedCategory;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.specs.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return a.id - b.id;
      });
  }, [searchQuery, selectedCategory, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('featured');
  };

  return (
    <section className="catalog-section">
      <div className="catalog-header">
        <div>
          <h1 className="catalog-title">Hardware & Peripherals</h1>
          <p className="catalog-subtitle">
            Curated laptops, monitors, keyboards, and components.
          </p>
        </div>
        <span className="catalog-count">
          {filteredProducts.length} of {products.length} items
        </span>
      </div>

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
              key={product.id}
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
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="modal-category">
                  {inspectedProduct.category}
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
              <div className="modal-spec-block">
                <h4>Specifications</h4>
                <p>{inspectedProduct.specs}</p>
              </div>
              <div className="modal-spec-block">
                <h4>Overview</h4>
                <p>{inspectedProduct.description}</p>
              </div>
              <div className="modal-price-row">
                <span>Price</span>
                <strong>
                  {inspectedProduct.price.toLocaleString('fr-DZ')} DZD
                </strong>
              </div>
            </div>

            <div className="modal-footer">
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
                  dispatch(addToCart(inspectedProduct));
                  setInspectedProduct(null);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductList;