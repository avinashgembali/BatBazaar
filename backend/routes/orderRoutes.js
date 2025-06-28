const express = require('express');
const Cart = require('../models/cart');
const Order = require('../models/order');
const router = express.Router();

//place order and clear cart
router.post('/place', async (req, res) => {
  const { email, items } = req.body;

  try {
    const total = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

    // Save order
    const newOrder = new Order({
      userEmail: email,
      items,
      totalPrice: total
    });

    await newOrder.save();

    // ✅ Properly clear the cart
    const userCart = await Cart.findOne({ userEmail: email });
    if (userCart) {
      userCart.items = [];
      await userCart.save();
    }

    res.status(201).json({ message: 'Order placed successfully and cart cleared.' });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// Get all orders for a user
router.get('/user/:email', async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.params.email });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

module.exports = router;
