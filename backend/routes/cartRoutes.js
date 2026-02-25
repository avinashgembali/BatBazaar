const express = require('express');
const Cart = require('../models/cart');
const Order = require('../models/order');
const router = express.Router();

// Get user's cart
router.get('/:email', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userEmail: req.params.email }) || { items: [] };

    const cartItemsWithImgUrl = cart.items.map(item => ({
      ...item.toObject(),
      imgUrl: item.img
    }));

    res.json(cartItemsWithImgUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get cart' });
  }
});

// Add item to cart
router.post('/:email', async (req, res) => {
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

// Remove item from cart (by index)
router.delete('/:email/:index', async (req, res) => {
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
