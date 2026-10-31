import React from "react";
import { useSelector } from "react-redux";

const Navbar = ({ darkMode, setDarkMode, showCart, setShowCart }) => {
  const cart = useSelector((state) => state.cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="navbar">
      <div className="logo" onClick={() => setShowCart(false)}>
        <span className="logo-icon">⚡</span>
        <h1>DzTech Store</h1>
      </div>

      <nav className="nav-actions">
        <button
          className="theme-btn"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>

        <button
          className="cart-toggle-btn"
          onClick={() => setShowCart(!showCart)}
        >
          🛒 {showCart ? "Back to Catalog" : "Cart"}
          <span className="cart-badge">{totalItems}</span>
        </button>
      </nav>
    </header>
  );
};

export default Navbar;