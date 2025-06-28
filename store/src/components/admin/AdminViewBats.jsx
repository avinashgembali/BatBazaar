import React, { useEffect, useState } from 'react';
import '../../styles/AdminOrderAndSales.css';

const AdminOrderAndSales = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('https://batbazaar.onrender.com/api/admin/orders')
      .then(res => res.json())
      .then(setOrders);
  }, []);

  const handleDeliver = async (orderId) => {
    const res = await fetch(`https://batbazaar.onrender.com/api/admin/orders/${orderId}/deliver`, {
      method: 'PUT'
    });
    const updated = await res.json();
    setOrders(prev => prev.map(o => o._id === orderId ? updated.order : o));
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="admin-order-sales-container">
      <div className="orders-section">
        <h2>🕓 Pending Orders ({pendingOrders.length})</h2>
        {pendingOrders.map(order => (
          <div key={order._id} className="order-card">
            <h4>{order.userEmail}</h4>
            <p><strong>Total:</strong> ₹{order.totalPrice}</p>
            <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
            <ul>
              {order.items.map((item, i) => (
                <li key={i}>{item.name} (x{item.quantity})</li>
              ))}
            </ul>
            <button
              className="status-btn pending"
              onClick={() => handleDeliver(order._id)}
            >
              Mark as Delivered
            </button>
          </div>
        ))}
      </div>

      <div className="sales-section">
        <h2>✅ Delivered Orders ({deliveredOrders.length})</h2>
        {deliveredOrders.map(order => (
          <div key={order._id} className="order-card delivered">
            <h4>{order.userEmail}</h4>
            <p><strong>Total:</strong> ₹{order.totalPrice}</p>
            <p><strong>Ordered:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
            <p><strong>Delivered:</strong> {new Date(order.deliveredDate).toLocaleDateString()}</p>
            <ul>
              {order.items.map((item, i) => (
                <li key={i}>{item.name} (x{item.quantity})</li>
              ))}
            </ul>
            <span className="status-label">Delivered</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrderAndSales;
