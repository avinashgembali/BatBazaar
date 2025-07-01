// src/components/Footer.jsx
import React from 'react';
import '../styles/footer.css';
import { useNavigate } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa'; 

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
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <FaFacebook />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
          <FaTwitter />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <FaInstagram />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
