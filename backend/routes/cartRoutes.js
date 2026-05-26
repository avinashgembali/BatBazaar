const express = require('express');
const Cart = require('../models/cart');
const Order = require('../models/order');
const auth = require('../middleware/auth');

const router = express.Router();

// All cart routes require a valid token (logged-in users only)

router.get('/:email', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userEmail: req.params.email }) || { items: [] };
    const cartItemsWithImgUrl = cart.items.map(item => ({
      ...item.toObject(),
      imgUrl: item.img
    }));
    res.json(cartItemsWithImgUrl);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get cart' });
  }
});

router.post('/:email', auth, async (req, res) => {
  try {
    const { email } = req.params;
    const item = req.body;

    let cart = await Cart.findOne({ userEmail: email });
    if (!cart) cart = new Cart({ userEmail: email, items: [] });

    cart.items.push(item);
    await cart.save();

    res.status(201).json(cart.items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add item' });
  }
});

router.delete('/:email/:index', auth, async (req, res) => {
  try {
    const { email, index } = req.params;
    const cart = await Cart.findOne({ userEmail: email });
    if (!cart || index < 0 || index >= cart.items.length) {
      return res.status(404).json({ message: 'Item not found' });
    }
    cart.items.splice(index, 1);
    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove item' });
  }
});

module.exports = router;
