import React from 'react';
import useAuthStore from '../../useAuthStore'; // adjust the path if needed
import '../styles/home.css';

const Home = () => {
  const { user } = useAuthStore();

  if (user?.role === 'admin') {
    return (
      <div className="admin-home">
        <h1>Welcome Admin 👑</h1>
        <div className="admin-options">
          <div className="admin-card">
            <h3>📦 Manage Bats</h3>
            <p>Create, update, or delete bats from the inventory.</p>
            <a href="/admin/manage-bats" className="admin-link">Go to Bat Manager</a>
          </div>
          <div className="admin-card">
            <h3>📊 View Bats</h3>
            <p>See all bats which are ordered and sold and who bought them.</p>
            <a href="/admin/sold-bats" className="admin-link">View Sales</a>
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
      <div className="hero-quote">
        <span className="unleash">Unleash</span>
        <br />
        the <br />
        <span className="power">Power</span> <br />
        of Every <br />
        <span className="stroke">Stroke⚡</span>
      </div>
    </div>
  );
};

export default Home;
