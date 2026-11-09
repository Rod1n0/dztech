import React, { useState } from 'react';

const ProductFormModal = ({ initialProduct, onClose, onSave }) => {
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name || '');
  const [category, setCategory] = useState(
    initialProduct?.category || 'Laptops'
  );
  const [price, setPrice] = useState(
    initialProduct?.price !== undefined ? String(initialProduct.price) : ''
  );
  const [originalPrice, setOriginalPrice] = useState(
    initialProduct?.originalPrice ? String(initialProduct.originalPrice) : ''
  );
  const [stock, setStock] = useState(
    initialProduct?.stock !== undefined ? String(initialProduct.stock) : '10'
  );
  const [specs, setSpecs] = useState(initialProduct?.specs || '');
  const [description, setDescription] = useState(
    initialProduct?.description || ''
  );
  const [imageUrl, setImageUrl] = useState(
    initialProduct?.imageUrl || initialProduct?.image || ''
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await onSave({
        name: name.trim(),
        category: category.trim(),
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        stock: Number(stock),
        specs: specs.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-category">
              {isEditing ? 'Update Product (PUT)' : 'New Product (POST)'}
            </span>
            <h2 className="modal-title">
              {isEditing ? `Edit ${initialProduct.name}` : 'Create Product'}
            </h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="prod-name">Product Name</label>
            <input
              id="prod-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MacBook Pro 14 M3"
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="prod-category">Category</label>
              <input
                id="prod-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Laptops, Monitors, Audio..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prod-stock">Stock Quantity</label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="prod-price">Price (DZD)</label>
              <input
                id="prod-price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="245000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prod-orig-price">Original Price (Optional)</label>
              <input
                id="prod-orig-price"
                type="number"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="265000"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="prod-specs">Hardware Specifications</label>
            <input
              id="prod-specs"
              type="text"
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              placeholder="M3 Pro · 18GB Unified · 512GB NVMe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-image">Image URL</label>
            <input
              id="prod-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-desc">Description</label>
            <input
              id="prod-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed overview of the product..."
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
