import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from '../redux/actions';

const Cart = ({ onContinueShopping }) => {
  const cart = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const [orderCompleted, setOrderCompleted] = useState(false);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setOrderCompleted(true);
    dispatch(clearCart());
  };

  if (orderCompleted) {
    return (
      <section className="cart-section">
        <div className="empty-state">
          <span className="status-pill">Order Confirmed</span>
          <h2>Thank you for your order</h2>
          <p>
            Your order has been placed and is being prepared for dispatch.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setOrderCompleted(false);
              if (onContinueShopping) onContinueShopping();
            }}
          >
            Back to Store
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-section">
      <div className="cart-header">
        <div>
          <h1 className="section-title">Shopping Cart</h1>
          <p className="section-subtitle">
            {totalItems === 0
              ? 'No items currently in your cart.'
              : `${totalItems} ${totalItems === 1 ? 'item' : 'items'} in your cart.`}
          </p>
        </div>

        {cart.length > 0 && (
          <div className="cart-header-actions">
            {onContinueShopping && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onContinueShopping}
              >
                Continue Shopping
              </button>
            )}
            <button
              type="button"
              className="btn-danger-outline"
              onClick={() => dispatch(clearCart())}
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          <h3>Your cart is empty</h3>
          <p>Explore the catalog and add products to get started.</p>
          {onContinueShopping && (
            <button
              type="button"
              className="btn-primary"
              onClick={onContinueShopping}
            >
              Browse Products
            </button>
          )}
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-details">
                  <span className="cart-item-category">{item.category}</span>
                  <h3 className="cart-item-name">{item.name}</h3>
                  <span className="cart-item-unit-price">
                    {item.price.toLocaleString('fr-DZ')} DZD each
                  </span>
                </div>

                <div className="cart-item-controls">
                  <div className="qty-control">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() =>
                        dispatch(updateQuantity(item.id, item.quantity - 1))
                      }
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={() =>
                        dispatch(updateQuantity(item.id, item.quantity + 1))
                      }
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-total">
                    {(item.price * item.quantity).toLocaleString('fr-DZ')} DZD
                  </div>

                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => dispatch(removeFromCart(item.id))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span>Items ({totalItems})</span>
              <span>{subtotal.toLocaleString('fr-DZ')} DZD</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{subtotal.toLocaleString('fr-DZ')} DZD</span>
            </div>

            <button
              type="button"
              className="btn-primary btn-block"
              onClick={handleCheckout}
            >
              Checkout
            </button>
          </aside>
        </div>
      )}
    </section>
  );
};

export default Cart;