import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/actions';

const ProductCard = ({ product, onSelectProduct }) => {
  const dispatch = useDispatch();
  const [imgError, setImgError] = useState(false);

  const productId = product.id || product._id;
  const imageSource = product.imageUrl || product.image;

  const cartItem = useSelector((state) =>
    state.cart.find((item) => (item.id || item._id) === productId)
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

        {!imgError && imageSource ? (
          <img
            src={imageSource}
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
        <p className="product-specs">
          {product.specs || product.description}
        </p>

        <div className="product-footer">
          <div className="price-group">
            <span className="price-current">
              {Number(product.price).toLocaleString('fr-DZ')}{' '}
              <small className="currency-code">DZD</small>
            </span>
            {hasDiscount && (
              <span className="price-original">
                {Number(product.originalPrice).toLocaleString('fr-DZ')} DZD
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
              onClick={() =>
                dispatch(
                  addToCart({
                    ...product,
                    id: productId,
                    image: imageSource,
                  })
                )
              }
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
