import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import '../styles/navbar.css';
import useAuthStore from '../../useAuthStore';

const NavBar = () => {
  const { user, isLoggedIn, logout, cartCount } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`nav-bar${scrolled ? ' nav-scrolled' : ''}`}>
      <div className="website-name" onClick={() => navigate('/')}>
        <h1>BatBazaar🏏</h1>
      </div>

      <nav className="nav-links">
        {[['/', 'Home'], ['/about', 'About'], ['/shop', 'Shop'], ['/contact', 'Contact']].map(([path, label]) => (
          <a
            key={path}
            onClick={() => navigate(path)}
            className={isActive(path) ? 'active' : ''}
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="register-buttons">
        {isLoggedIn ? (
          <>
            <span className="nav-greeting">Hi, {user.username}</span>

            {user.role !== 'admin' && (
              <>
                <button onClick={() => navigate('/cart')} className="cart-btn">
                  <FaShoppingCart /> Cart
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </button>
                <button onClick={() => navigate('/order')} className="orders-btn">Orders</button>
              </>
            )}

            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <button className="login-btn-nav" onClick={() => navigate('/login')}>
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default NavBar;
