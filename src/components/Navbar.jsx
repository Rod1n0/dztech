import React from 'react';
import { useSelector } from 'react-redux';

const Navbar = ({ activeTab, setActiveTab, theme, onToggleTheme }) => {
  const cart = useSelector((state) => state.cart);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div
          className="brand"
          onClick={() => setActiveTab('catalog')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setActiveTab('catalog')}
        >
          <span className="brand-dot" />
          <span className="brand-name">DzTech</span>
        </div>

        <nav className="nav-actions" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Products
          </button>

          <button
            type="button"
            className={`nav-cart-btn ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
          >
            <svg
              className="icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Cart</span>
            <span className="cart-badge">{totalItems}</span>
            {totalAmount > 0 && (
              <span className="cart-subtotal">
                {totalAmount.toLocaleString('fr-DZ')} DZD
              </span>
            )}
          </button>

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg
                className="icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                className="icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            <span className="theme-toggle-label">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;