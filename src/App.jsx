import React, { useState } from "react";
import Navbar from "./components/Navbar";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [showCart, setShowCart] = useState(false);

  return (
    <div className={`app-wrapper ${darkMode ? "dark-theme" : "light-theme"}`}>
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        showCart={showCart}
        setShowCart={setShowCart}
      />

      <main className="main-content">
        <div className="Split-Layout">
          <div className="catalog-column">
            <ProductList />
          </div>
          <aside className={`cart-column ${showCart ? "expanded" : ""}`}>
            <Cart />
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;