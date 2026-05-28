import { useEffect, useState, useRef } from 'react';
import useAuthStore from '../../useAuthStore';
import { authFetch } from '../api';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart } from 'react-icons/fa';
import AIChatbot from './AIChatbot';
import '../styles/shop.css';
import { toast } from 'react-toastify';

const SORT_LABELS = { 'low-high': 'Price: Low → High', 'high-low': 'Price: High → Low' };

const Shop = () => {
  const { isLoggedIn, user, cartItems, setCartItems } = useAuthStore();
  const [bats, setBats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [dataRange, setDataRange] = useState([0, 30000]);

  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 30000]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState('none');

  const [loading, setLoading] = useState(true);
  // Set of bat._id strings currently being synced to backend
  const [cartLoadingIds, setCartLoadingIds] = useState(new Set());
  const errorShown = useRef(false);

  // Fetch bats
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
        setBrands([...new Set(data.map(b => b.name.toLowerCase()))].sort());
        if (data.length > 0) {
          const prices = data.map(b => b.price);
          const cleanMin = Math.floor(Math.min(...prices) / 1000) * 1000;
          const cleanMax = Math.min(Math.ceil(Math.max(...prices) / 1000) * 1000, 30000);
          setDataRange([cleanMin, cleanMax]);
          setPriceRange([cleanMin, cleanMax]);
        }
      })
      .catch(() => {
        if (!errorShown.current) { toast.error('Failed to fetch bats.'); errorShown.current = true; }
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch cart on mount so product cards show correct quantities
  useEffect(() => {
    if (!isLoggedIn || !user?.email) return;
    authFetch(`${import.meta.env.VITE_API_URL}/cart/${user.email}`)
      .then(r => r.json())
      .then(data => setCartItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isLoggedIn, user?.email]);

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const getCartQty = (bat) => {
    const found = cartItems.find(ci => ci.productId?.toString() === bat._id?.toString());
    return found?.quantity || 0;
  };

  const setLoadingId = (id, on) =>
    setCartLoadingIds(prev => { const s = new Set(prev); on ? s.add(id) : s.delete(id); return s; });

  const increaseQty = async (bat) => {
    if (!isLoggedIn) { toast.warn('Please login to add items to cart.'); return; }
    const batId = bat._id?.toString();
    if (cartLoadingIds.has(batId)) return;

    const currentQty = getCartQty(bat);
    const prevItems = cartItems;

    // Optimistic update
    const optimistic = currentQty > 0
      ? cartItems.map(ci => ci.productId?.toString() === batId ? { ...ci, quantity: currentQty + 1 } : ci)
      : [...cartItems, { productId: bat._id, name: bat.name, type: bat.type, price: bat.price, rating: bat.rating, imgUrl: bat.imgUrl, quantity: 1 }];
    setCartItems(optimistic);
    setLoadingId(batId, true);

    try {
      // Always POST — backend atomically increments if item exists, inserts if new
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/cart/${user.email}`, {
        method: 'POST',
        body: JSON.stringify({ productId: bat._id, name: bat.name, type: bat.type, price: bat.price, rating: bat.rating, img: bat.imgUrl, quantity: 1 }),
      });
      if (!res.ok) throw new Error();
      setCartItems(await res.json());
      if (currentQty === 0) toast.success(`${bat.name.toUpperCase()} added to cart!`);
    } catch {
      setCartItems(prevItems);
      toast.error('Failed to update cart.');
    } finally {
      setLoadingId(batId, false);
    }
  };

  const decreaseQty = async (bat) => {
    if (!isLoggedIn) return;
    const batId = bat._id?.toString();
    if (cartLoadingIds.has(batId)) return;
    const currentQty = getCartQty(bat);
    if (currentQty <= 0) return;

    const prevItems = cartItems;
    const newQty = currentQty - 1;

    // Optimistic update
    const optimistic = newQty === 0
      ? cartItems.filter(ci => ci.productId?.toString() !== batId)
      : cartItems.map(ci => ci.productId?.toString() === batId ? { ...ci, quantity: newQty } : ci);
    setCartItems(optimistic);
    setLoadingId(batId, true);

    try {
      const url = `${import.meta.env.VITE_API_URL}/cart/${user.email}/${bat._id}`;
      const res = newQty === 0
        ? await authFetch(url, { method: 'DELETE' })
        : await authFetch(url, { method: 'PATCH', body: JSON.stringify({ quantity: newQty }) });
      if (!res.ok) throw new Error();
      setCartItems(await res.json());
    } catch {
      setCartItems(prevItems);
      toast.error('Failed to update cart.');
    } finally {
      setLoadingId(batId, false);
    }
  };

  // ── Filters ─────────────────────────────────────────────────────────────────
  const toggleBrand = (brand) =>
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);

  const clearFilters = () => { setSelectedBrands([]); setPriceRange(dataRange); setMinRating(0); setSort('none'); };

  const applyAIFilters = ({ brands, priceRange: pr, minRating: mr, sort: s }) => {
    setSelectedBrands(brands); setPriceRange(pr); setMinRating(mr); setSort(s);
  };

  const filteredBats = bats.filter(b => {
    const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(b.name.toLowerCase());
    const priceMatch = b.price >= priceRange[0] && b.price <= priceRange[1];
    const ratingMatch = b.rating >= minRating;
    return brandMatch && priceMatch && ratingMatch;
  }).sort((a, b) => {
    if (sort === 'low-high') return a.price - b.price;
    if (sort === 'high-low') return b.price - a.price;
    return 0;
  });

  const rangeSpan = dataRange[1] - dataRange[0] || 1;
  const priceFillLeft = ((priceRange[0] - dataRange[0]) / rangeSpan) * 100;
  const priceFillWidth = ((priceRange[1] - priceRange[0]) / rangeSpan) * 100;
  const ratingFillWidth = (minRating / 5) * 100;

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return [
      ...Array.from({ length: full }, (_, i) => <FaStar key={`f${i}`} className="star filled" />),
      ...(half ? [<FaStarHalfAlt key="h" className="star filled" />] : []),
      ...Array.from({ length: empty }, (_, i) => <FaRegStar key={`e${i}`} className="star empty" />),
    ];
  };

  return (
    <div className="shop-container">
      <aside className="filters">
        <div className="filter-title-row">
          <h2 className="filter-title">Filters</h2>
          <button className="clear-all-btn" onClick={clearFilters}>Clear All</button>
        </div>

        <div className="filter-section">
          <div className="filter-section-head">
            <h3>Brand</h3>
            {selectedBrands.length > 0 && (
              <button className="clear-sel-btn" onClick={() => setSelectedBrands([])}>Clear</button>
            )}
          </div>
          {brands.map(brand => (
            <label key={brand} className={`checkbox-option${selectedBrands.includes(brand) ? ' selected' : ''}`}>
              <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)} />
              {brand.toUpperCase()}
            </label>
          ))}
        </div>

        <div className="filter-section">
          <h3>Price</h3>
          <div className="slider-value-row">
            <span className="slider-val">₹{priceRange[0].toLocaleString()}</span>
            <span className="slider-sep">–</span>
            <span className="slider-val">₹{priceRange[1].toLocaleString()}</span>
          </div>
          <div className="slider-wrap">
            <div className="slider-track">
              <div className="slider-track-fill" style={{ left: `${priceFillLeft}%`, width: `${priceFillWidth}%` }} />
            </div>
            <input type="range" className="dual-range" min={dataRange[0]} max={dataRange[1]} step={500}
              value={priceRange[0]} style={{ zIndex: priceRange[0] >= priceRange[1] - 500 ? 5 : 3 }}
              onChange={e => { const v = Math.min(Number(e.target.value), priceRange[1] - 500); setPriceRange(prev => [v, prev[1]]); }} />
            <input type="range" className="dual-range" min={dataRange[0]} max={dataRange[1]} step={500}
              value={priceRange[1]} style={{ zIndex: priceRange[0] >= priceRange[1] - 500 ? 3 : 5 }}
              onChange={e => { const v = Math.max(Number(e.target.value), priceRange[0] + 500); setPriceRange(prev => [prev[0], v]); }} />
          </div>
          <div className="slider-bounds">
            <span>₹{dataRange[0].toLocaleString()}</span>
            <span>₹{dataRange[1].toLocaleString()}</span>
          </div>
        </div>

        <div className="filter-section">
          <h3>Min Rating</h3>
          <div className="slider-value-row">
            <span className="slider-val">{minRating === 0 ? 'Any' : `${minRating.toFixed(2)} ⭐ & above`}</span>
          </div>
          <div className="slider-wrap">
            <div className="slider-track">
              <div className="slider-track-fill" style={{ left: 0, width: `${ratingFillWidth}%` }} />
            </div>
            <input type="range" className="dual-range" min={0} max={5} step={0.05}
              value={minRating} style={{ zIndex: 5 }} onChange={e => setMinRating(Number(e.target.value))} />
          </div>
          <div className="slider-bounds"><span>0</span><span>5 ⭐</span></div>
        </div>

        <div className="filter-section">
          <h3>Sort</h3>
          {['none', 'low-high', 'high-low'].map(s => (
            <label key={s} className={`filter-option${sort === s ? ' selected' : ''}`}>
              <input type="radio" name="sort" value={s} checked={sort === s} onChange={e => setSort(e.target.value)} />
              {s === 'none' ? 'Default' : SORT_LABELS[s]}
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
            <button onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          filteredBats.map(bat => {
            const qty = getCartQty(bat);
            const isUpdating = cartLoadingIds.has(bat._id?.toString());
            return (
              <div className="bat-card" key={bat._id?.toString()}>
                <div className="bat-img-wrapper">
                  <img src={bat.imgUrl} alt={`${bat.name} bat`} loading="lazy" />
                  {qty > 0 && <span className="cart-qty-badge">{qty}</span>}
                </div>
                <div className="bat-info">
                  <p className="bat-brand">{bat.name.toUpperCase()}</p>
                  <p className="bat-type">{bat.type}</p>
                  <div className="bat-stars">{renderStars(bat.rating)}<span className="bat-rating-num">{bat.rating}</span></div>
                  <p className="bat-price">₹{bat.price.toLocaleString()}</p>

                  {user?.role !== 'admin' && (
                    qty === 0 ? (
                      <button
                        className="add-to-cart-btn"
                        onClick={() => increaseQty(bat)}
                        disabled={isUpdating}
                        aria-label="Add to cart"
                      >
                        {isUpdating ? <span className="stepper-dot" /> : <FaShoppingCart />}
                      </button>
                    ) : (
                      <div className="bat-cart-stepper">
                        <button
                          className="stepper-btn"
                          onClick={() => decreaseQty(bat)}
                          aria-label="Decrease quantity"
                        >−</button>
                        <span className="stepper-count in-cart">
                          {isUpdating
                            ? <span className="stepper-dot" />
                            : <span key={qty} className="stepper-num">{qty}</span>}
                        </span>
                        <button
                          className="stepper-btn"
                          onClick={() => increaseQty(bat)}
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AIChatbot bats={bats} brands={brands} dataRange={dataRange} onApplyFilters={applyAIFilters} />
    </div>
  );
};

export default Shop;
