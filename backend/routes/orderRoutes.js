const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Cart = require('../models/cart');
const Order = require('../models/order');
const auth = require('../middleware/auth');

const router = express.Router();

// Razorpay instance — uses Key ID + Key Secret from .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── STEP 1: Create a Razorpay order ─────────────────────────────────────────
// Frontend calls this first when user clicks "Pay Now".
// We create an order on Razorpay's servers and send back the orderId + amount.
// The frontend uses this to open the Razorpay checkout popup.
//
// Why backend? The Key Secret must never go to the frontend.
// Only the backend (with the secret) can create orders on Razorpay.

router.post('/create-razorpay-order', auth, async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees from frontend

    const options = {
      amount: Math.round(amount * 100), // Razorpay needs paise (1 rupee = 100 paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    // order.id looks like: "order_PAbcdXYZ..."
    // Send this back to frontend to open the checkout popup

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create Razorpay order', error: err.message });
  }
});

// ─── STEP 2: Verify payment + save order ─────────────────────────────────────
// After the user pays in the Razorpay popup, Razorpay gives the frontend:
//   razorpay_order_id, razorpay_payment_id, razorpay_signature
//
// We verify the signature here to confirm payment is genuine (not faked).
// Signature check: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, KeySecret)
// If it matches the signature Razorpay sent → payment is real → save order to DB.

router.post('/place', auth, async (req, res) => {
  const { email, items, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    // Build the expected signature using our Key Secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // If signatures don't match → someone tampered with the payment data
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Signature valid — payment is genuine. Save the order.
    const total = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    const totalWithTax = Math.round(total * 1.10); // includes 10% CGST

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
