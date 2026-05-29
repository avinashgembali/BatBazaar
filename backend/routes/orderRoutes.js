const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Cart = require('../models/cart');
const Order = require('../models/order');
const Bat = require('../models/bat');
const auth = require('../middleware/auth');

const router = express.Router();

// Razorpay instance — uses Key ID + Key Secret from .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── STEP 1: Create a Razorpay order ─────────────────────────────────────────
router.post('/create-razorpay-order', auth, async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees from frontend

    const options = {
      amount: Math.round(amount * 100), // Razorpay needs paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create Razorpay order', error: err.message });
  }
});

// ─── STEP 2: Verify payment + deduct stock + save order ──────────────────────
router.post('/place', auth, async (req, res) => {
  const { email, items, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    // Verify payment signature — confirms payment is genuine
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Atomically deduct stock for each item; rollback all on any failure
    const deducted = [];
    for (const item of items) {
      if (!item.productId) continue;
      const qty = item.quantity || 1;

      // findOneAndUpdate with $gte guard prevents stock going below 0
      const updated = await Bat.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );

      if (!updated) {
        // Rollback all previously deducted stock
        for (const { id, qty: q } of deducted) {
          await Bat.findByIdAndUpdate(id, { $inc: { stock: q } });
        }
        return res.status(400).json({
          message: `"${item.name}" is out of stock or has insufficient quantity. Please update your cart.`,
        });
      }

      deducted.push({ id: updated._id, qty });
    }

    // Stock deducted — save the order
    const total = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    const totalWithTax = Math.round(total * 1.10); // 10% CGST

    const newOrder = new Order({
      userEmail: email,
      items,
      totalPrice: totalWithTax,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    await newOrder.save();

    // Clear the cart after successful order
    const userCart = await Cart.findOne({ userEmail: email });
    if (userCart) {
      userCart.items = [];
      await userCart.save();
    }

    res.status(201).json({ message: 'Order placed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to place order', error: err.message });
  }
});

// ─── Get all orders for a user ────────────────────────────────────────────────
router.get('/user/:email', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.params.email });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

module.exports = router;
