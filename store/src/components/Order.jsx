import { useEffect, useState } from 'react';
import useAuthStore from '../../useAuthStore';
import { authFetch } from '../api';
import '../styles/order.css';
import { toast } from 'react-toastify';

const STEPS = ['Order Placed', 'Processing', 'Delivered'];

const OrderStepper = ({ status }) => {
  const activeStep = status === 'delivered' ? 2 : 1;
  return (
    <div className="stepper">
      {STEPS.map((step, i) => (
        <div key={step} className="stepper-item">
          <div className={`stepper-dot${i <= activeStep ? ' done' : ''}${i === activeStep ? ' current' : ''}`}>
            {i < activeStep ? '✓' : i + 1}
          </div>
          <span className={`stepper-label${i <= activeStep ? ' done' : ''}`}>{step}</span>
          {i < STEPS.length - 1 && <div className={`stepper-line${i < activeStep ? ' done' : ''}`} />}
        </div>
      ))}
    </div>
  );
};

const Order = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      authFetch(`${import.meta.env.VITE_API_URL}/orders/user/${user.email}`)
        .then(res => res.json())
        .then(data => setOrders(data))
        .catch(() => toast.error('Failed to fetch orders'))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return (
    <div className="order-page">
      <h1>📦 My Orders</h1>
      <div className="order-list">
        {[1,2].map(i => <div key={i} className="order-skeleton" />)}
      </div>
    </div>
  );

  return (
    <div className="order-page">
      <h1>📦 My Orders</h1>
      {orders.length === 0 ? (
        <div className="order-empty">
          <span>📭</span>
          <p>No orders yet. Start shopping!</p>
          <a href="/shop" className="order-shop-link">Browse Shop</a>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order, i) => (
            <div key={i} className="order-card">
              <div className="order-card-header">
                <div>
                  <p className="order-date">Placed on {new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="order-total">Total: <strong>₹{order.totalPrice?.toLocaleString()}</strong></p>
                </div>
                <span className={`status-badge ${order.status}`}>{order.status}</span>
              </div>

              <OrderStepper status={order.status} />

              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <img src={item.img || item.imgUrl} alt={item.name} />
                    <div className="item-details">
                      <p className="item-name">{item.name}</p>
                      <p className="item-sub">{item.brand || item.type}</p>
                      <p className="item-price">₹{item.price?.toLocaleString()} × {item.quantity || 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Order;
