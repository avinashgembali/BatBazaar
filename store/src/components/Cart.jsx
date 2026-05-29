import { useEffect, useRef, useState } from 'react';
import useAuthStore from '../../useAuthStore';
import { authFetch } from '../api';
import { FaShoppingCart, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/cart.css';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const Cart = () => {
  const { user, isLoggedIn, cartItems, setCartItems } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cartLoadingIds, setCartLoadingIds] = useState(new Set());
  const rzpRef = useRef(null);

  const setLoadingId = (id, on) =>
    setCartLoadingIds(prev => { const s = new Set(prev); on ? s.add(id) : s.delete(id); return s; });

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    authFetch(`${import.meta.env.VITE_API_URL}/cart/${user.email}`)
      .then(res => res.json())
      .then(data => setCartItems(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to fetch cart'))
      .finally(() => setLoading(false));
  }, [isLoggedIn, user?.email]);

  const increaseQtyCart = async (item) => {
    const itemKey = item._id?.toString();
    if (cartLoadingIds.has(itemKey)) return;
    if ((item.stock ?? 0) === 0) { toast.warn('This item is out of stock.'); return; }
    if (item.stock !== undefined && (item.quantity || 1) >= item.stock) {
      toast.warn(`Only ${item.stock} available in stock.`);
      return;
    }
    const prevItems = cartItems;
    setCartItems(cartItems.map(ci =>
      ci._id?.toString() === itemKey ? { ...ci, quantity: (ci.quantity || 1) + 1 } : ci
    ));
    setLoadingId(itemKey, true);
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/cart/${user.email}`, {
        method: 'POST',
        body: JSON.stringify({
          productId: item.productId,
          name: item.name,
          type: item.type,
          price: item.price,
          rating: item.rating,
          img: item.imgUrl || item.img,
          quantity: 1,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update cart.');
      }
      setCartItems(await res.json());
    } catch (err) {
      setCartItems(prevItems);
      toast.error(err.message || 'Failed to update cart.');
    } finally {
      setLoadingId(itemKey, false);
    }
  };

  const decreaseQtyCart = async (item) => {
    const itemKey = item._id?.toString();
    if (cartLoadingIds.has(itemKey)) return;
    const currentQty = item.quantity || 1;
    const newQty = currentQty - 1;
    const prevItems = cartItems;
    const lookupId = item.productId || item._id;
    if (newQty === 0) {
      setCartItems(cartItems.filter(ci => ci._id?.toString() !== itemKey));
    } else {
      setCartItems(cartItems.map(ci =>
        ci._id?.toString() === itemKey ? { ...ci, quantity: newQty } : ci
      ));
    }
    setLoadingId(itemKey, true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/cart/${user.email}/${lookupId}`;
      const res = newQty === 0
        ? await authFetch(url, { method: 'DELETE' })
        : await authFetch(url, { method: 'PATCH', body: JSON.stringify({ quantity: newQty }) });
      if (!res.ok) throw new Error();
      setCartItems(await res.json());
      if (newQty === 0) toast.success('Item removed from cart.');
    } catch {
      setCartItems(prevItems);
      toast.error('Failed to update cart.');
    } finally {
      setLoadingId(itemKey, false);
    }
  };

  const handleRemove = async (item) => {
    const lookupId = item.productId || item._id;
    const prevItems = cartItems;
    setCartItems(cartItems.filter(ci => ci._id?.toString() !== item._id?.toString()));
    try {
      const res = await authFetch(
        `${import.meta.env.VITE_API_URL}/cart/${user.email}/${lookupId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error();
      setCartItems(await res.json());
      toast.success('Item removed from cart.');
    } catch {
      setCartItems(prevItems);
      toast.error('Failed to remove item.');
    }
  };

  // ─── Razorpay checkout flow ───────────────────────────────────────────────
  // Step 1: Ask our backend to create a Razorpay order (returns orderId + amount)
  // Step 2: Open Razorpay popup with that orderId
  // Step 3: User pays with test card → Razorpay gives us payment proof
  // Step 4: Send proof to our backend → backend verifies → saves order to DB
  const handlePayNow = async () => {
    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        toast.error('Payment service failed to load. Please refresh.');
        setPaying(false);
        return;
      }
      // Step 1 — create Razorpay order on our backend
      const orderRes = await authFetch(
        `${import.meta.env.VITE_API_URL}/orders/create-razorpay-order`,
        {
          method: 'POST',
          body: JSON.stringify({ amount: totalAmount }), // in rupees
        }
      );

      // 401 = no token or expired token → user needs to re-login
      if (orderRes.status === 401) {
        setPaying(false);
        toast.error('Session expired. Please log out and log in again.');
        return;
      }

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${orderRes.status}`);
      }

      const { orderId, amount, currency } = await orderRes.json();

      // Step 2 — open Razorpay popup
      // window.Razorpay is available because we loaded checkout.js in index.html
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,           // in paise (already converted by backend)
        currency,
        name: 'BatBazaar',
        description: 'Cricket Bat Purchase',
        order_id: orderId, // the Razorpay order ID from Step 1
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: { color: '#2563eb' },

        // Step 3 — called automatically when payment succeeds
        handler: async (response) => {
          // response = {
          //   razorpay_order_id,
          //   razorpay_payment_id,   ← proof that payment happened
          //   razorpay_signature     ← cryptographic proof it's genuine
          // }
          try {
            // Step 4 — send proof to our backend to verify + save order
            const placeRes = await authFetch(
              `${import.meta.env.VITE_API_URL}/orders/place`,
              {
                method: 'POST',
                body: JSON.stringify({
                  email: user.email,
                  items: cartItems,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            if (!placeRes.ok) throw new Error('Order save failed');

            // Success — clear cart UI
            setCartItems([]);
            toast.success('Payment successful! Order placed.');
          } catch {
            toast.error('Payment received but order save failed. Contact support.');
          } finally {
            setPaying(false);
          }
        },

        // Called when user closes the popup without paying
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.info('Payment cancelled.');
          },
        },
      };

      rzpRef.current = new window.Razorpay(options);
      rzpRef.current.on('payment.failed', () => {
        setPaying(false);
        toast.error('Payment failed. Please try again.');
      });
      rzpRef.current.open();
    } catch (err) {
      setPaying(false);
      console.error('[Razorpay] Payment error:', err);
      toast.error(err.message || 'Could not start payment. Try again.');
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  const cgst = subtotal * 0.10;
  const totalAmount = Math.round(subtotal + cgst);
  const hasSoldOutItems = cartItems.some(item => (item.stock ?? 0) === 0);

  if (!isLoggedIn) return (
    <div className="cart-empty-page">
      <p>Please login to view your cart.</p>
    </div>
  );

  return (
    <div className="cart-page">
      <h1 className="cart-heading"><FaShoppingCart /> Your Cart</h1>

      {loading ? (
        <div className="cart-container">
          {[1, 2, 3].map(i => <div key={i} className="cart-skeleton" />)}
        </div>
      ) : cartItems.length === 0 ? (
        <div className="cart-empty">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="56" fill="#eff6ff" />
            <path d="M30 38h8l10 36h34l8-28H48" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="54" cy="82" r="4" fill="#2563eb" />
            <circle cx="74" cy="82" r="4" fill="#2563eb" />
          </svg>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any bats yet.</p>
          <a href="/shop" className="cart-shop-link">Browse Shop</a>
        </div>
      ) : (
        <>
          <div className="cart-container">
            {cartItems.map((item) => {
              const itemKey = item._id?.toString();
              const isUpdating = cartLoadingIds.has(itemKey);
              return (
                <div key={itemKey} className={`cart-card${(item.stock ?? 0) === 0 ? ' cart-card-soldout' : ''}`}>
                  <img src={item.imgUrl} alt={item.name} className="cart-img" />
                  <div className="cart-info">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-sub">{item.type}</p>
                    <p className="cart-item-sub">⭐ {item.rating}</p>
                    {(item.stock ?? 0) === 0 && (
                      <p className="cart-item-soldout">Out of Stock — remove to checkout</p>
                    )}
                    <p className="cart-item-price">₹{item.price.toLocaleString()}</p>
                    <div className="cart-item-actions">
                      <div className="cart-stepper">
                        <button className="cart-stepper-btn" onClick={() => decreaseQtyCart(item)} aria-label="Decrease">−</button>
                        <span className="cart-stepper-count">
                          {isUpdating
                            ? <span className="cart-stepper-dot" />
                            : <span key={item.quantity} className="stepper-num">{item.quantity || 1}</span>}
                        </span>
                        <button
                          className="cart-stepper-btn"
                          onClick={() => increaseQtyCart(item)}
                          disabled={(item.stock ?? 0) === 0 || (item.stock !== undefined && (item.quantity || 1) >= item.stock)}
                          aria-label="Increase"
                        >+</button>
                      </div>
                      <button className="cart-remove-icon" onClick={() => handleRemove(item)} title="Remove item" aria-label="Remove">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="cart-summary-row muted"><span>CGST (10%)</span><span>₹{Math.round(cgst).toLocaleString()}</span></div>
            <div className="cart-summary-divider" />
            <div className="cart-summary-row total"><span>Total</span><span>₹{totalAmount.toLocaleString()}</span></div>

            <button
              className={`checkout-btn${paying ? ' paying' : ''}`}
              onClick={handlePayNow}
              disabled={paying || hasSoldOutItems}
            >
              {paying ? (
                <><span className="spinner" /> Processing…</>
              ) : (
                <><FaShoppingCart /> Pay Now ₹{totalAmount.toLocaleString()}</>
              )}
            </button>
            {hasSoldOutItems && (
              <p className="cart-soldout-warning">Remove out-of-stock items to proceed.</p>
            )}
            <p className="razorpay-note">🔒 Secured by Razorpay</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
