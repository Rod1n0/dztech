import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import AuthModal from './components/AuthModal';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('dztech_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [auth, setAuth] = useState(() => {
    try {
      const savedToken = localStorage.getItem('dztech_auth_token');
      const savedUser = localStorage.getItem('dztech_auth_user');
      return {
        token: savedToken || null,
        user: savedUser ? JSON.parse(savedUser) : null,
      };
    } catch {
      return { token: null, user: null };
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('dztech_theme', theme);
    } catch {
      // Ignore storage errors in restricted browsing modes
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleAuthSuccess = ({ user, token }) => {
    setAuth({ user, token });
    try {
      localStorage.setItem('dztech_auth_token', token);
      localStorage.setItem('dztech_auth_user', JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  };

  const handleLogout = () => {
    setAuth({ user: null, token: null });
    try {
      localStorage.removeItem('dztech_auth_token');
      localStorage.removeItem('dztech_auth_user');
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <div className="app-shell">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        user={auth.user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      <main className="main-container">
        {activeTab === 'catalog' ? (
          <ProductList user={auth.user} token={auth.token} />
        ) : (
          <Cart onContinueShopping={() => setActiveTab('catalog')} />
        )}
      </main>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

export default App;
