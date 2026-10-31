import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/actions";

const ProductCard = ({ product }) => {
  const [showDetails, setShowDetails] = useState(false);
  const dispatch = useDispatch();
  const cartItem = useSelector((state) =>
    state.cart.find((item) => item.id === product.id)
  );

  const handleAddToCart = () => {
    dispatch(addToCart(product));
  };

  return (
    <div className="product-card">
      <div className="image-wrapper">
        <img src={product.image} alt={product.name} />
        {product.discount && (
          <span className="discount-badge">{product.discount}</span>
        )}
      </div>

      <div className="product-info">
        <span className="category-tag">{product.category}</span>
        <h3>{product.name}</h3>
        <p className="price">{product.price.toLocaleString()} DZD</p>

        <button
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide Details ▲" : "View Details ▼"}
        </button>

        {showDetails && <p className="description">{product.description}</p>}

        <button className="add-btn" onClick={handleAddToCart}>
          {cartItem
            ? `In Cart (${cartItem.quantity}) — Add More`
            : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;