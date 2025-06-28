const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const userRoutes = require('./routes/userRoutes');
const batRoutes = require('./routes/batRoutes');
const cartRoutes = require('./routes/cartRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');


const app = express();
const port = 8000;

// ✅ Connect to MongoDB
connectDB();

// ✅ CORS configuration (frontend is running on localhost:5173)
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://batbazaar-1.onrender.com' // allow deployed frontend
  ],
  credentials: true
}));

// ✅ Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ API Routes
app.use('/api/users', userRoutes);
app.use('/api/bats', batRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);


// ✅ Root route
app.get('/', (req, res) => {
  res.send('Welcome to BatBazaar API!');
});

// ✅ Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
