import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/actions';

const ProductCard = ({ product, onSelectProduct }) => {
  const dispatch = useDispatch();
  const [imgError, setImgError] = useState(false);

  const cartItem = useSelector((state) =>
    state.cart.find((item) => item.id === product.id)
  );
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const hasDiscount =
    product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <article className="product-card">
      <div className="product-media">
        <div className="product-badges">
          <span className="badge-category">{product.category}</span>
          {hasDiscount && (
            <span className="badge-discount">-{discountPercent}%</span>
          )}
        </div>

        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            className="product-image"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-image-fallback">
            <span>{product.category}</span>
          </div>
        )}
      </div>

      <div className="product-body">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-specs">{product.specs}</p>

        <div className="product-footer">
          <div className="price-group">
            <span className="price-current">
              {product.price.toLocaleString('fr-DZ')}{' '}
              <small className="currency-code">DZD</small>
            </span>
            {hasDiscount && (
              <span className="price-original">
                {product.originalPrice.toLocaleString('fr-DZ')} DZD
              </span>
            )}
          </div>

          <div className="card-actions">
            {onSelectProduct && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onSelectProduct(product)}
              >
                Details
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              onClick={() => dispatch(addToCart(product))}
            >
              {quantityInCart > 0
                ? `Add (+${quantityInCart} in cart)`
                : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;