import '../styles/footer.css';
import { useNavigate } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">BatBazaar 🏏</span>

        <nav className="footer-nav">
          <a onClick={() => navigate('/about')}>About Us</a>
          <span className="footer-sep">·</span>
          <a onClick={() => navigate('/shop')}>Shop</a>
          <span className="footer-sep">·</span>
          <a onClick={() => navigate('/contact')}>Contact</a>
        </nav>

        <div className="social-media">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
        </div>

        <p className="footer-copy">© 2025 BatBazaar. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
