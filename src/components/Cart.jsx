import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../redux/actions";

const Cart = () => {
  const cart = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  if (cart.length === 0) {
    return (
      <div className="cart-container empty-cart">
        <h2>Your Shopping Cart is Empty 🛒</h2>
        <p>Browse the catalog and add some tech gear to your cart!</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>Your Shopping Cart</h2>
        <button className="clear-btn" onClick={() => dispatch(clearCart())}>
          Clear Cart
        </button>
      </div>

      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.id} className="cart-item">
            <img src={item.image} alt={item.name} className="cart-item-img" />
            <div className="cart-item-info">
              <h4>{item.name}</h4>
              <p>{item.price.toLocaleString()} DZD each</p>
            </div>

            <div className="quantity-controls">
              <button
                onClick={() =>
                  dispatch(updateQuantity(item.id, item.quantity - 1))
                }
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() =>
                  dispatch(updateQuantity(item.id, item.quantity + 1))
                }
              >
                +
              </button>
            </div>

            <p className="item-subtotal">
              {(item.price * item.quantity).toLocaleString()} DZD
            </p>

            <button
              className="remove-btn"
              onClick={() => dispatch(removeFromCart(item.id))}
            >
              ✕ Remove
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <h3>Total: {totalPrice.toLocaleString()} DZD</h3>
        <button
          className="checkout-btn"
          onClick={() => alert("Order simulated! (Frontend Lab Demo)")}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;