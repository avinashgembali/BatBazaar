import React, { useEffect, useState } from 'react';
import useAuthStore from '../../useAuthStore';
import '../styles/order.css';
import { toast } from 'react-toastify'; // ✅ Import toast

const Order = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user?.email) {
      fetch(`http://localhost:8000/api/orders/user/${user.email}`)
        .then(res => res.json())
        .then(data => setOrders(data))
        .catch(() => toast.error('Failed to fetch orders')); 
    }
  }, [user]);

  return (
    <div className="order-page">
      <h1>📦 My Orders</h1>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="order-list">
          {orders.map((order, i) => (
            <div key={i} className="order-card">
              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <img src={`http://localhost:8000/uploads/${item.img}`} alt={item.name} />
                    <div className="item-details">
                      <p><strong>{item.name}</strong></p>
                      <p>Brand: {item.brand}</p>
                      <p>₹{item.price} x {item.quantity || 1}</p>
                    </div>
                    <div className={`status-badge ${order.status}`}>
                      {order.status}
                    </div>
                  </div>
                ))}
              </div>
              <p className="order-meta">
                Total: ₹{order.totalPrice} | Placed on: {new Date(order.orderDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Order;
