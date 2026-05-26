import { useEffect, useState, useRef } from 'react';
import useAuthStore from '../../useAuthStore';
import { authFetch } from '../api';
import { FaShoppingCart } from 'react-icons/fa';
import '../styles/shop.css';
import { toast } from 'react-toastify';

const PRICE_LABELS = { '<5000': 'Under ₹5,000', '5000-10000': '₹5,000 – ₹10,000', '10000-15000': '₹10,000 – ₹15,000', '15000-20000': '₹15,000 – ₹20,000', '>20000': 'Above ₹20,000' };
const SORT_LABELS = { 'low-high': 'Price: Low → High', 'high-low': 'Price: High → Low' };

const Shop = () => {
  const { isLoggedIn, user } = useAuthStore();
  const [bats, setBats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [filters, setFilters] = useState({ brand: 'none', price: 'none', rating: 'none', sort: 'none' });
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const errorShown = useRef(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/bats/bat`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        if (Array.isArray(data) && data.length === 0 && !errorShown.current) {
          toast.info('No bats in store.');
          errorShown.current = true;
        }
        setBats(data);
        setQuantities(Object.fromEntries(data.map((_, i) => [i, 1])));
        setBrands([...new Set(data.map(b => b.name.toLowerCase()))].sort());
      })
      .catch(() => {
        if (!errorShown.current) { toast.error('Failed to fetch bats.'); errorShown.current = true; }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const adjustQty = (index, delta) => {
    setQuantities(prev => ({ ...prev, [index]: Math.max(1, (prev[index] || 1) + delta) }));
  };

  const handleAddToCart = async (bat, index) => {
    if (!isLoggedIn || !user?.email) { toast.warn('Please login to add items to cart.'); return; }
    try {
      const response = await authFetch(`${import.meta.env.VITE_API_URL}/cart/${user.email}`, {
        method: 'POST',
        body: JSON.stringify({ ...bat, quantity: quantities[index] || 1 }),
      });
      if (!response.ok) throw new Error();
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add item to cart.');
    }
  };

  const filteredBats = bats.filter(b => {
    const brandMatch = filters.brand === 'none' || b.name.toLowerCase() === filters.brand;
    let priceMatch = true;
    switch (filters.price) {
      case '<5000': priceMatch = b.price < 5000; break;
      case '5000-10000': priceMatch = b.price >= 5000 && b.price <= 10000; break;
      case '10000-15000': priceMatch = b.price > 10000 && b.price <= 15000; break;
      case '15000-20000': priceMatch = b.price > 15000 && b.price <= 20000; break;
      case '>20000': priceMatch = b.price > 20000; break;
    }
    let ratingMatch = true;
    switch (filters.rating) {
      case '4.5+': ratingMatch = b.rating > 4.5; break;
      case '4-4.5': ratingMatch = b.rating >= 4 && b.rating <= 4.5; break;
      case '3.5-4': ratingMatch = b.rating >= 3.5 && b.rating <= 4; break;
      case '3-3.5': ratingMatch = b.rating >= 3 && b.rating <= 3.5; break;
      case '<3': ratingMatch = b.rating < 3; break;
    }
    return brandMatch && priceMatch && ratingMatch;
  }).sort((a, b) => {
    if (filters.sort === 'low-high') return a.price - b.price;
    if (filters.sort === 'high-low') return b.price - a.price;
    return 0;
  });

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  };

  return (
    <div className="shop-container">
      <aside className="filters">
        <h2 className="filter-title">Filters</h2>

        <div className="filter-section">
          <h3>Brand</h3>
          {['none', ...brands].map(brand => (
            <label key={brand} className={`filter-option${filters.brand === brand ? ' selected' : ''}`}>
              <input type="radio" name="brand" value={brand} checked={filters.brand === brand} onChange={handleFilterChange} />
              {brand === 'none' ? 'All Brands' : brand.toUpperCase()}
            </label>
          ))}
        </div>

        <div className="filter-section">
          <h3>Price</h3>
          {['none', '<5000', '5000-10000', '10000-15000', '15000-20000', '>20000'].map(price => (
            <label key={price} className={`filter-option${filters.price === price ? ' selected' : ''}`}>
              <input type="radio" name="price" value={price} checked={filters.price === price} onChange={handleFilterChange} />
              {price === 'none' ? 'Any Price' : PRICE_LABELS[price]}
            </label>
          ))}
        </div>

        <div className="filter-section">
          <h3>Rating</h3>
          {['none', '4.5+', '4-4.5', '3.5-4', '3-3.5', '<3'].map(rate => (
            <label key={rate} className={`filter-option${filters.rating === rate ? ' selected' : ''}`}>
              <input type="radio" name="rating" value={rate} checked={filters.rating === rate} onChange={handleFilterChange} />
              {rate === 'none' ? 'Any Rating' : `${rate} ⭐`}
            </label>
          ))}
        </div>

        <div className="filter-section">
          <h3>Sort</h3>
          {['none', 'low-high', 'high-low'].map(sort => (
            <label key={sort} className={`filter-option${filters.sort === sort ? ' selected' : ''}`}>
              <input type="radio" name="sort" value={sort} checked={filters.sort === sort} onChange={handleFilterChange} />
              {sort === 'none' ? 'Default' : SORT_LABELS[sort]}
            </label>
          ))}
        </div>
      </aside>

      <div className="product-display">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bat-skeleton">
              <div className="skeleton-img" />
              <div className="skeleton-line wide" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          ))
        ) : filteredBats.length === 0 ? (
          <div className="no-results">
            <span>🔍</span>
            <p>No bats match your filters.</p>
            <button onClick={() => setFilters({ brand: 'none', price: 'none', rating: 'none', sort: 'none' })}>
              Clear Filters
            </button>
          </div>
        ) : (
          filteredBats.map((bat, index) => (
            <div className="bat-card" key={index}>
              <div className="bat-img-wrapper">
                <img src={bat.imgUrl} alt={`${bat.name} bat`} loading="lazy" />
              </div>
              <div className="bat-info">
                <p className="bat-brand">{bat.name.toUpperCase()}</p>
                <p className="bat-type">{bat.type}</p>
                <p className="bat-stars">{renderStars(bat.rating)} <span>{bat.rating}</span></p>
                <p className="bat-price">₹{bat.price.toLocaleString()}</p>

                {user?.role !== 'admin' && (
                  <div className="bat-controls">
                    <div className="qty-stepper">
                      <button onClick={() => adjustQty(index, -1)}>−</button>
                      <span>{quantities[index] || 1}</span>
                      <button onClick={() => adjustQty(index, 1)}>+</button>
                    </div>
                    <button className="add-to-cart" onClick={() => handleAddToCart(bat, index)}>
                      <FaShoppingCart />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Shop;
