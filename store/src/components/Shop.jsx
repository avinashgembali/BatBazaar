import { useEffect, useState, useRef } from 'react';
import useAuthStore from '../../useAuthStore';
import { authFetch } from '../api';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart } from 'react-icons/fa';
import AIChatbot from './AIChatbot';
import '../styles/shop.css';
import { toast } from 'react-toastify';

const SORT_LABELS = { 'low-high': 'Price: Low → High', 'high-low': 'Price: High → Low' };
const LIMIT = 10;

const Shop = () => {
  const { isLoggedIn, user, cartItems, setCartItems } = useAuthStore();

  // ── Data state ───────────────────────────────────────────────────────────────
  const [bats, setBats]           = useState([]);
  const [brands, setBrands]       = useState([]);
  const [dataRange, setDataRange] = useState([0, 30000]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ── Filter / sort / page state ───────────────────────────────────────────────
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [priceRange, setPriceRange]         = useState([0, 30000]);
  const [minRating, setMinRating]           = useState(0);
  const [sort, setSort]                     = useState('none');
  const [page, setPage]                     = useState(1);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [loading, setLoading]               = useState(true);
  const [statsReady, setStatsReady]         = useState(false);
  const [cartLoadingIds, setCartLoadingIds] = useState(new Set());
  const fetchTimerRef = useRef(null);
  const errorShown    = useRef(false);

  // ── Stats fetch (brands + price range) — once on mount ───────────────────────
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/bats/stats`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(({ brands: b, minPrice, maxPrice }) => {
        const cleanMin = Math.floor(minPrice / 1000) * 1000;
        const cleanMax = Math.min(Math.ceil(maxPrice / 1000) * 1000, 30000);
        setBrands(b);
        setDataRange([cleanMin, cleanMax]);
        setPriceRange([cleanMin, cleanMax]);
        setStatsReady(true);           // triggers first bats fetch with correct range
      })
      .catch(() => {
        setStatsReady(true);           // still allow bats fetch even if stats fail
      });
  }, []);

  // ── Bats fetch — re-runs on any filter / sort / page change (debounced 350ms) ─
  useEffect(() => {
    if (!statsReady) return;

    setLoading(true);
    clearTimeout(fetchTimerRef.current);

    fetchTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
      params.set('minPrice', priceRange[0]);
      params.set('maxPrice', priceRange[1]);
      if (minRating > 0) params.set('minRating', minRating);
      if (sort !== 'none') params.set('sort', sort);
      params.set('page', page);
      params.set('limit', LIMIT);

      fetch(`${import.meta.env.VITE_API_URL}/bats/bat?${params}`)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(({ bats: data, totalCount: count, totalPages: pages }) => {
          setBats(data);
          setTotalCount(count);
          setTotalPages(pages);
          if (count === 0 && selectedBrands.length === 0 && minRating === 0 && sort === 'none' && !errorShown.current) {
            toast.info('No bats in store.');
            errorShown.current = true;
          }
        })
        .catch(() => {
          if (!errorShown.current) { toast.error('Failed to fetch bats.'); errorShown.current = true; }
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => clearTimeout(fetchTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsReady, selectedBrands, priceRange[0], priceRange[1], minRating, sort, page]);

  // ── Cart fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || !user?.email) return;
    authFetch(`${import.meta.env.VITE_API_URL}/cart/${user.email}`)
      .then(r => r.json())
      .then(data => setCartItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isLoggedIn, user?.email]);

  // ── Cart helpers ──────────────────────────────────────────────────────────────
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
    if ((bat.stock ?? 0) === 0) { toast.warn('This item is out of stock.'); return; }

    const currentQty = getCartQty(bat);
    if (bat.stock !== undefined && currentQty >= bat.stock) {
      toast.warn(`Only ${bat.stock} available in stock.`);
      return;
    }

    const prevItems  = cartItems;

    const optimistic = currentQty > 0
      ? cartItems.map(ci => ci.productId?.toString() === batId ? { ...ci, quantity: currentQty + 1 } : ci)
      : [...cartItems, { productId: bat._id, name: bat.name, type: bat.type, price: bat.price, rating: bat.rating, imgUrl: bat.imgUrl, quantity: 1 }];
    setCartItems(optimistic);
    setLoadingId(batId, true);

    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/cart/${user.email}`, {
        method: 'POST',
        body: JSON.stringify({ productId: bat._id, name: bat.name, type: bat.type, price: bat.price, rating: bat.rating, img: bat.imgUrl, quantity: 1 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update cart.');
      }
      setCartItems(await res.json());
      if (currentQty === 0) toast.success(`${bat.name.toUpperCase()} added to cart!`);
    } catch (err) {
      setCartItems(prevItems);
      toast.error(err.message || 'Failed to update cart.');
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
    const newQty    = currentQty - 1;

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

  // ── Filter handlers — always reset to page 1 ─────────────────────────────────
  const toggleBrand = (brand) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedBrands([]); setPriceRange(dataRange); setMinRating(0); setSort('none'); setPage(1);
  };

  const applyAIFilters = ({ brands, priceRange: pr, minRating: mr, sort: s }) => {
    setSelectedBrands(brands); setPriceRange(pr); setMinRating(mr); setSort(s); setPage(1);
  };

  // ── Slider visuals (unchanged) ────────────────────────────────────────────────
  const rangeSpan      = dataRange[1] - dataRange[0] || 1;
  const priceFillLeft  = ((priceRange[0] - dataRange[0]) / rangeSpan) * 100;
  const priceFillWidth = ((priceRange[1] - priceRange[0]) / rangeSpan) * 100;
  const ratingFillWidth = (minRating / 5) * 100;

  const renderStars = (rating) => {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return [
      ...Array.from({ length: full },  (_, i) => <FaStar key={`f${i}`} className="star filled" />),
      ...(half ? [<FaStarHalfAlt key="h" className="star filled" />] : []),
      ...Array.from({ length: empty }, (_, i) => <FaRegStar key={`e${i}`} className="star empty" />),
    ];
  };

  // ── Pagination ────────────────────────────────────────────────────────────────
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end   = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    const pageNums = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    return (
      <div className="pagination">
        <button className="pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>

        {start > 1 && (
          <>
            <button className="pagination-num" onClick={() => setPage(1)}>1</button>
            {start > 2 && <span className="pagination-ellipsis">…</span>}
          </>
        )}

        {pageNums.map(p => (
          <button key={p} className={`pagination-num${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
            <button className="pagination-num" onClick={() => setPage(totalPages)}>{totalPages}</button>
          </>
        )}

        <button className="pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────
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
              <button className="clear-sel-btn" onClick={() => { setSelectedBrands([]); setPage(1); }}>Clear</button>
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
              onChange={e => { const v = Math.min(Number(e.target.value), priceRange[1] - 500); setPriceRange(prev => [v, prev[1]]); setPage(1); }} />
            <input type="range" className="dual-range" min={dataRange[0]} max={dataRange[1]} step={500}
              value={priceRange[1]} style={{ zIndex: priceRange[0] >= priceRange[1] - 500 ? 3 : 5 }}
              onChange={e => { const v = Math.max(Number(e.target.value), priceRange[0] + 500); setPriceRange(prev => [prev[0], v]); setPage(1); }} />
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
              value={minRating} style={{ zIndex: 5 }}
              onChange={e => { setMinRating(Number(e.target.value)); setPage(1); }} />
          </div>
          <div className="slider-bounds"><span>0</span><span>5 ⭐</span></div>
        </div>

        <div className="filter-section">
          <h3>Sort</h3>
          {['none', 'low-high', 'high-low'].map(s => (
            <label key={s} className={`filter-option${sort === s ? ' selected' : ''}`}>
              <input type="radio" name="sort" value={s} checked={sort === s}
                onChange={e => { setSort(e.target.value); setPage(1); }} />
              {s === 'none' ? 'Default' : SORT_LABELS[s]}
            </label>
          ))}
        </div>
      </aside>

      <div className="product-display">
        <div className="bats-grid">
          {loading ? (
            Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="bat-skeleton">
                <div className="skeleton-img" />
                <div className="skeleton-line wide" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))
          ) : bats.length === 0 ? (
            <div className="no-results">
              <span>🔍</span>
              <p>No bats match your filters.</p>
              <button onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            bats.map(bat => {
              const qty        = getCartQty(bat);
              const isUpdating = cartLoadingIds.has(bat._id?.toString());
              const isSoldOut  = (bat.stock ?? 0) === 0;
              const atLimit    = bat.stock !== undefined && qty >= bat.stock;
              return (
                <div className={`bat-card${isSoldOut ? ' bat-card-soldout' : ''}`} key={bat._id?.toString()}>
                  <div className="bat-img-wrapper">
                    <img src={bat.imgUrl} alt={`${bat.name} bat`} loading="lazy" />
                    {isSoldOut && (
                      <div className="sold-out-overlay">
                        <span className="sold-out-label">Sold Out</span>
                      </div>
                    )}
                    {!isSoldOut && qty > 0 && <span className="cart-qty-badge">{qty}</span>}
                  </div>
                  <div className="bat-info">
                    <p className="bat-brand">{bat.name.toUpperCase()}</p>
                    <p className="bat-type">{bat.type}</p>
                    <div className="bat-stars">{renderStars(bat.rating)}<span className="bat-rating-num">{bat.rating}</span></div>
                    <p className="bat-price">₹{bat.price.toLocaleString()}</p>

                    {user?.role !== 'admin' && (
                      isSoldOut ? (
                        <button className="add-to-cart-btn sold-out" disabled aria-label="Sold out">
                          Sold Out
                        </button>
                      ) : qty === 0 ? (
                        <button
                          className="add-to-cart-btn"
                          onClick={() => increaseQty(bat)}
                          disabled={isUpdating}
                          aria-label="Add to cart"
                        >
                          {isUpdating ? <span className="shop-loading-dot" /> : <FaShoppingCart />}
                        </button>
                      ) : (
                        <div className="bat-cart-stepper">
                          <button className="stepper-btn" onClick={() => decreaseQty(bat)} aria-label="Decrease quantity">−</button>
                          <span className="stepper-count in-cart">
                            {isUpdating
                              ? <span className="shop-loading-dot" />
                              : <span key={qty} className="stepper-num">{qty}</span>}
                          </span>
                          <button
                            className="stepper-btn"
                            onClick={() => increaseQty(bat)}
                            disabled={atLimit || isUpdating}
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

        {!loading && renderPagination()}
      </div>

      <AIChatbot bats={bats} brands={brands} dataRange={dataRange} onApplyFilters={applyAIFilters} />
    </div>
  );
};

export default Shop;
