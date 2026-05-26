import { useEffect, useState } from 'react';
import useAuthStore from '../../useAuthStore';
import { authFetch } from '../api';
import { FaShoppingCart, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/cart.css';

const Cart = () => {
  const { user, isLoggedIn, setCartCount } = useAuthStore();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const syncCount = (items) => setCartCount(items.length);

  useEffect(() => {
    if (!isLoggedIn) return;
    authFetch(`${import.meta.env.VITE_API_URL}/cart/${user.email}`)
      .then(res => res.json())
      .then(data => { setCartItems(data); syncCount(data); })
      .catch(() => toast.error('Failed to fetch cart'))
      .finally(() => setLoading(false));
  }, [isLoggedIn, user]);

  const handleRemove = async (index) => {
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/cart/${user.email}/${index}`, { method: 'DELETE' });
      const updated = await res.json();
      setCartItems(updated);
      syncCount(updated);
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/orders/place`, {
        method: 'POST',
        body: JSON.stringify({ email: user.email, items: cartItems }),
      });
      if (!res.ok) throw new Error();
      setCartItems([]);
      syncCount([]);
      toast.success('Order placed successfully!');
    } catch {
      toast.error('Failed to place order');
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  const cgst = subtotal * 0.10;
  const totalAmount = subtotal + cgst;

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
          {[1,2,3].map(i => <div key={i} className="cart-skeleton" />)}
        </div>
      ) : cartItems.length === 0 ? (
        <div className="cart-empty">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="56" fill="#eff6ff" />
            <path d="M30 38h8l10 36h34l8-28H48" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="54" cy="82" r="4" fill="#2563eb"/>
            <circle cx="74" cy="82" r="4" fill="#2563eb"/>
          </svg>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any bats yet.</p>
          <a href="/shop" className="cart-shop-link">Browse Shop</a>
        </div>
      ) : (
        <>
          <div className="cart-container">
            {cartItems.map((item, index) => (
              <div key={index} className="cart-card">
                <img src={item.imgUrl} alt={item.name} className="cart-img" />
                <div className="cart-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-sub">{item.type}</p>
                  <p className="cart-item-sub">⭐ {item.rating}</p>
                  <p className="cart-item-price">₹{item.price.toLocaleString()}</p>
                  <p className="cart-item-sub">Qty: {item.quantity || 1}</p>
                  <button className="remove-from-cart" onClick={() => handleRemove(index)}>
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="cart-summary-row muted"><span>CGST (10%)</span><span>₹{cgst.toFixed(0)}</span></div>
            <div className="cart-summary-divider" />
            <div className="cart-summary-row total"><span>Total</span><span>₹{totalAmount.toLocaleString()}</span></div>
            <button className="checkout-btn" onClick={handlePlaceOrder}>
              <FaShoppingCart /> Place Order
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
