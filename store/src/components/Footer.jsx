import React from 'react';
import '../styles/footer.css';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <p>&copy; 2025 BatBazaar. All rights reserved.</p>
      <nav className="footer-nav">
        <a onClick={() => navigate('/about')}>About Us</a> |{' '}
        <a onClick={() => navigate('/shop')}>Shop</a> |{' '}
        <a onClick={() => navigate('/contact')}>Contact</a>
      </nav>
      <div className="social-media">
        <a href="#" className="fa fa-facebook" aria-label="Facebook"></a>
        <a href="#" className="fa fa-twitter" aria-label="Twitter"></a>
        <a href="#" className="fa fa-instagram" aria-label="Instagram"></a>
      </div>
    </footer>
  );
};

export default Footer;
