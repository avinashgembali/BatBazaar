import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../useAuthStore';
import '../styles/home.css';

const Home = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (user?.role === 'admin') {
    return (
      <div className="admin-home">
        <h1>Welcome back, Admin 👑</h1>
        <p className="admin-subtitle">Manage your inventory and track orders from here.</p>
        <div className="admin-options">
          <div className="admin-card" onClick={() => navigate('/admin/manage-bats')}>
            <span className="admin-icon">📦</span>
            <h3>Manage Bats</h3>
            <p>Add, update, or remove bats from the inventory.</p>
            <span className="admin-link">Open →</span>
          </div>
          <div className="admin-card" onClick={() => navigate('/admin/sold-bats')}>
            <span className="admin-icon">📊</span>
            <h3>View Orders</h3>
            <p>See all orders and mark them as delivered.</p>
            <span className="admin-link">Open →</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-section">
      <div className="hero-img">
        <img src="/images/bat1.jpg" alt="bat image with a ball" />
      </div>
      <div className="hero-content">
        <div className="hero-quote">
          <span className="unleash">Unleash</span>
          {' '}the{' '}
          <span className="power">Power</span>
          <br />of Every{' '}
          <span className="stroke">Stroke⚡</span>
        </div>
        <p className="hero-sub">Premium cricket bats sourced directly from the finest craftsmen in India.</p>
        <div className="hero-actions">
          <button className="hero-cta" onClick={() => navigate('/shop')}>Shop Now →</button>
          <button className="hero-secondary" onClick={() => navigate('/about')}>Our Story</button>
        </div>
        <div className="hero-stats">
          <div className="stat"><strong>500+</strong><span>Bats in stock</span></div>
          <div className="stat-divider" />
          <div className="stat"><strong>50+</strong><span>Top brands</span></div>
          <div className="stat-divider" />
          <div className="stat"><strong>4.8★</strong><span>Avg rating</span></div>
        </div>
      </div>
    </div>
  );
};

export default Home;
