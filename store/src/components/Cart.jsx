import React, { useEffect, useState } from 'react';
import useAuthStore from '../../useAuthStore';
import { FaShoppingCart, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify'; // ✅ Import toast
import '../styles/cart.css';

const Cart = () => {
  const { user, isLoggedIn } = useAuthStore();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    if (isLoggedIn) {
      fetch(`http://localhost:8000/api/cart/${user.email}`)
        .then(res => res.json())
        .then(data => setCartItems(data))
        .catch(() => toast.error('Failed to fetch cart'));
    }
  }, [isLoggedIn, user]);

  const handleRemove = async (index) => {
    try {
      const res = await fetch(`https://batbazaar.onrender.com/api/cart/${user.email}/${index}`, {
        method: 'DELETE',
      });
      const updated = await res.json();
      setCartItems(updated);
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const res = await fetch(`https://batbazaar.onrender.com/api/orders/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, items: cartItems }),
      });

      if (!res.ok) throw new Error();
      setCartItems([]);
      toast.success('Order placed successfully!');
    } catch {
      toast.error('Failed to place order');
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  const cgst = subtotal * 0.10;
  const totalAmount = subtotal + cgst;

  if (!isLoggedIn) return <p>Please login to view your cart.</p>;

  return (
    <div className="cart-page">
      <h1><FaShoppingCart /> Your Cart</h1>
      <div className="cart-container">
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          cartItems.map((item, index) => (
            <div key={index} className="cart-card">
              <img
                src={item.imgUrl}
                alt={item.name}
                className="cart-img"
              />
              <div className="cart-info">
                <p><strong>Name:</strong> {item.name}</p>
                <p><strong>Type:</strong> {item.type}</p>
                <p><strong>Rating:</strong> {item.rating}⭐</p>
                <p><strong>Price:</strong> ₹{item.price.toLocaleString()}</p>
                <p><strong>Qty:</strong> {item.quantity || 1}</p>
                <button
                  className="remove-from-cart"
                  onClick={() => handleRemove(index)}
                >
                  <FaTrash /> Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="cart-total">
          <h2>Subtotal: ₹{subtotal.toLocaleString()}</h2>
          <p>CGST (10%): ₹{cgst.toFixed(0)}</p>
          <h2>Total: ₹{totalAmount.toLocaleString()}</h2>
          <button className="checkout-btn" onClick={handlePlaceOrder}>
            <FaShoppingCart /> Place Order
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
