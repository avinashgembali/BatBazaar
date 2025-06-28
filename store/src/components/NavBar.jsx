import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/navbar.css';
import useAuthStore from '../../useAuthStore';

const NavBar = () => {
  const { user, isLoggedIn, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToCart = () => {
    navigate('/cart');
  };

  const goToOrders = () => {
    navigate('/order');
  };

  return (
    <header className="nav-bar">
      <div className="website-name">
        <h1>BatBazaar🏏</h1>
      </div>

      <nav className="nav-links">
        <a onClick={() => navigate("/")}>Home</a>
        <a onClick={() => navigate("/about")}>AboutUs</a>
        <a onClick={() => navigate("/shop")}>Shop</a>
        <a onClick={() => navigate("/contact")}>Contact</a>
      </nav>

      <div className="register-buttons" id="user-section">
        {isLoggedIn ? (
          <>
            <span style={{ marginRight: '10px', fontWeight: 'bold' }}>
              Hi, {user.username}
            </span>

            {/* ✅ Only show Cart and Orders if user is NOT an admin */}
            {user.role !== 'admin' && (
              <>
                <button onClick={goToCart} className="cart-btn">🛒 Cart</button>
                <button onClick={goToOrders} className="orders-btn">Orders</button>
              </>
            )}

            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <button className="login" onClick={() => navigate("/login")}>
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default NavBar;
