import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('dztech_theme') || 'dark';
    } catch {
      return 'dark';
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

  return (
    <div className="app-shell">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="main-container">
        {activeTab === 'catalog' ? (
          <ProductList />
        ) : (
          <Cart onContinueShopping={() => setActiveTab('catalog')} />
        )}
      </main>
    </div>
  );
}

export default App;