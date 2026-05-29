import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa';
import '../styles/navbar.css';
import useAuthStore from '../../useAuthStore';

const NAV_LINKS = [['/', 'Home'], ['/about', 'About'], ['/shop', 'Shop'], ['/contact', 'Contact']];

const NavBar = () => {
  const { user, isLoggedIn, logout, cartCount } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;

  const go = (path) => { navigate(path); setMenuOpen(false); };

  return (
    <header className={`nav-bar${scrolled ? ' nav-scrolled' : ''}`} ref={menuRef}>
      <div className="website-name" onClick={() => go('/')}>
        <h1>BatBazaar🏏</h1>
      </div>

      {/* Nav links — pages always shown; auth actions appended for mobile */}
      <nav className={`nav-links${menuOpen ? ' open' : ''}`}>
        {NAV_LINKS.map(([path, label]) => (
          <a key={path} onClick={() => go(path)} className={isActive(path) ? 'active' : ''}>
            {label}
          </a>
        ))}

        {/* Mobile-only: Orders / Cart / Logout inside the dropdown */}
        {isLoggedIn && user.role !== 'admin' && (
          <>
            <div className="nav-dropdown-divider" />
            <a className={`nav-dropdown-link${isActive('/order') ? ' active' : ''}`} onClick={() => go('/order')}>
              📦 My Orders
            </a>
            <a className={`nav-dropdown-link${isActive('/cart') ? ' active' : ''}`} onClick={() => go('/cart')}>
              🛒 Cart {cartCount > 0 ? `(${cartCount})` : ''}
            </a>
          </>
        )}

        {isLoggedIn && (
          <>
            {user.role === 'admin' && <div className="nav-dropdown-divider" />}
            <a className="nav-dropdown-link danger" onClick={() => { handleLogout(); setMenuOpen(false); }}>
              🚪 Logout
            </a>
          </>
        )}
      </nav>

      <div className="register-buttons">
        {isLoggedIn ? (
          <>
            <span className="nav-greeting">Hi, {user.username}</span>

            {user.role !== 'admin' && (
              <>
                <button onClick={() => go('/cart')} className="cart-btn">
                  <FaShoppingCart /> Cart
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </button>
                <button onClick={() => go('/order')} className="orders-btn">Orders</button>
              </>
            )}

            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <button className="login-btn-nav" onClick={() => go('/login')}>Login</button>
        )}
      </div>

      {/* Hamburger — mobile only */}
      <button
        className="hamburger"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle navigation"
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>
    </header>
  );
};

export default NavBar;
