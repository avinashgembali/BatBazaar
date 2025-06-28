import React, { useEffect, useState, useRef } from 'react';
import useAuthStore from '../../useAuthStore';
import { FaShoppingCart } from 'react-icons/fa';
import '../styles/shop.css';
import { toast } from 'react-toastify'; // ✅ Import toast

const Shop = () => {
  const { isLoggedIn, user } = useAuthStore();
  const [bats, setBats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [filters, setFilters] = useState({ brand: 'none', price: 'none', rating: 'none', sort: 'none' });
  const [quantities, setQuantities] = useState({});
  const errorShown = useRef(false);

  useEffect(() => {
    fetch('https://batbazaar.onrender.com/api/bats/bat')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length === 0 && !errorShown.current) {
          toast.info('No bats in store.');  
          errorShown.current = true;
        }

        setBats(data);
        setQuantities(Object.fromEntries(data.map((_, i) => [i, 1])));

        const uniqueBrands = [...new Set(data.map(b => b.name.toLowerCase()))].sort();
        setBrands(uniqueBrands);
      })
      .catch(() => {
        if (!errorShown.current) {
          toast.error('Failed to fetch bats.');  
          errorShown.current = true;
        }
      });
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (index, value) => {
    setQuantities(prev => ({ ...prev, [index]: Number(value) }));
  };

  const handleAddToCart = async (bat, index) => {
    if (!isLoggedIn || !user?.email) {
      toast.warn('Please login to add items to cart.');  
      return;
    }

    const item = {
      ...bat,
      quantity: quantities[index] || 1,
    };

    try {
      const response = await fetch(`https://batbazaar.onrender.com/api/cart/${user.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (!response.ok) throw new Error();
      toast.success('Added to cart!');  
    } catch {
      toast.error('Failed to add item to cart.');  
    }
  };

  const filteredBats = bats.filter(b => {
    const brandMatch = filters.brand === 'none' || b.name.toLowerCase() === filters.brand;
    const price = b.price;
    const rating = b.rating;

    let priceMatch = true;
    switch (filters.price) {
      case '<5000': priceMatch = price < 5000; break;
      case '5000-10000': priceMatch = price >= 5000 && price <= 10000; break;
      case '10000-15000': priceMatch = price > 10000 && price <= 15000; break;
      case '15000-20000': priceMatch = price > 15000 && price <= 20000; break;
      case '>20000': priceMatch = price > 20000; break;
    }

    let ratingMatch = true;
    switch (filters.rating) {
      case '4.5+': ratingMatch = rating > 4.5; break;
      case '4-4.5': ratingMatch = rating >= 4 && rating <= 4.5; break;
      case '3.5-4': ratingMatch = rating >= 3.5 && rating <= 4; break;
      case '3-3.5': ratingMatch = rating >= 3 && rating <= 3.5; break;
      case '<3': ratingMatch = rating < 3; break;
    }

    return brandMatch && priceMatch && ratingMatch;
  }).sort((a, b) => {
    if (filters.sort === 'low-high') return a.price - b.price;
    if (filters.sort === 'high-low') return b.price - a.price;
    return 0;
  });

  return (
    <div className="shop-container">
      <div className="filters">
        <h2>Brands</h2>
        {['none', ...brands].map(brand => (
          <div key={brand}>
            <input
              type="radio"
              name="brand"
              value={brand}
              checked={filters.brand === brand}
              onChange={handleFilterChange}
            />
            <label><strong>{brand === 'none' ? 'Clear' : brand.toUpperCase()}</strong></label><br />
          </div>
        ))}

        <h2>Price Ranges</h2>
        {['none', '<5000', '5000-10000', '10000-15000', '15000-20000', '>20000'].map(price => (
          <div key={price}>
            <input
              type="radio"
              name="price"
              value={price}
              checked={filters.price === price}
              onChange={handleFilterChange}
            />
            <label><strong>{price === 'none' ? 'Clear' : price}</strong></label><br />
          </div>
        ))}

        <h2>Rating</h2>
        {['none', '4.5+', '4-4.5', '3.5-4', '3-3.5', '<3'].map(rate => (
          <div key={rate}>
            <input
              type="radio"
              name="rating"
              value={rate}
              checked={filters.rating === rate}
              onChange={handleFilterChange}
            />
            <label><strong>{rate === 'none' ? 'Clear' : rate}</strong></label><br />
          </div>
        ))}

        <h2>Sort</h2>
        {['none', 'low-high', 'high-low'].map(sort => (
          <div key={sort}>
            <input
              type="radio"
              name="sort"
              value={sort}
              checked={filters.sort === sort}
              onChange={handleFilterChange}
            />
            <label><strong>{sort === 'none' ? 'Clear' : sort}</strong></label><br />
          </div>
        ))}
      </div>

      <div className="product-display">
        {filteredBats.length === 0 ? (
          <p>No bats match your filters.</p>
        ) : (
          filteredBats.map((bat, index) => (
            <div className="bat-card" key={index}>
              <img
                src={bat.imgUrl}
                alt={`${bat.name} bat`}
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
              <div className="bat-info">
                <p><strong>Brand:</strong> {bat.name}</p>
                <p><strong>Type:</strong> {bat.type}</p>
                <p><strong>Rating:</strong> {bat.rating}⭐</p>
                <p><strong>Price:</strong> ₹{bat.price.toLocaleString()}</p>
                <label>
                  Quantity:
                  <input
                    type="number"
                    min="1"
                    value={quantities[index] || 1}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    style={{ width: '50px', marginLeft: '10px' }}
                  />
                </label>
                <button className="add-to-cart" onClick={() => handleAddToCart(bat, index)}>
                  <FaShoppingCart style={{ color: 'white' }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Shop;
