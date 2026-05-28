const express = require('express');
const Cart = require('../models/cart');
const Order = require('../models/order');
const auth = require('../middleware/auth');

const router = express.Router();

const withImgUrl = (items) =>
  items.map(item => ({ ...item.toObject(), imgUrl: item.img }));

// GET cart
router.get('/:email', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userEmail: req.params.email }) || { items: [] };
    res.json(withImgUrl(cart.items));
  } catch (err) {
    console.error('GET /cart error:', err);
    res.status(500).json({ message: 'Failed to get cart' });
  }
});

// POST — atomic upsert: increment qty if item exists, push if new
router.post('/:email', auth, async (req, res) => {
  try {
    const { email } = req.params;
    const { productId, name, type, price, rating, img, quantity = 1 } = req.body;

    if (!productId) return res.status(400).json({ message: 'productId required' });

    // MongoDB positional operator: let the DB do the ObjectId cast & match
    let cart = await Cart.findOneAndUpdate(
      { userEmail: email, 'items.productId': productId },
      { $inc: { 'items.$.quantity': quantity } },
      { new: true }
    );

    if (!cart) {
      // Item not yet in cart — push it (create cart document if needed)
      cart = await Cart.findOneAndUpdate(
        { userEmail: email },
        { $push: { items: { productId, name, type, price, rating, img, quantity } } },
        { new: true, upsert: true }
      );
    }

    res.json(withImgUrl(cart.items));
  } catch (err) {
    console.error('POST /cart error:', err);
    res.status(500).json({ message: 'Failed to add item' });
  }
});

// PATCH — set quantity by productId (or subdocument _id as fallback for old entries)
router.patch('/:email/:productId', auth, async (req, res) => {
  try {
    const { email, productId } = req.params;
    const { quantity } = req.body;

    let cart;

    if (quantity <= 0) {
      // Remove the item
      cart = await Cart.findOneAndUpdate(
        { userEmail: email },
        { $pull: { items: { productId } } },
        { new: true }
      );
      // Fallback: old entries without productId — pull by subdocument _id
      if (cart && cart.items.some(i => i._id?.toString() === productId)) {
        cart = await Cart.findOneAndUpdate(
          { userEmail: email },
          { $pull: { items: { _id: productId } } },
          { new: true }
        );
      }
    } else {
      // Update quantity — DB does the ObjectId cast from string productId
      cart = await Cart.findOneAndUpdate(
        { userEmail: email, 'items.productId': productId },
        { $set: { 'items.$.quantity': quantity } },
        { new: true }
      );
      // Fallback: try matching by subdocument _id
      if (!cart) {
        cart = await Cart.findOneAndUpdate(
          { userEmail: email, 'items._id': productId },
          { $set: { 'items.$.quantity': quantity } },
          { new: true }
        );
      }
    }

    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    res.json(withImgUrl(cart.items));
  } catch (err) {
    console.error('PATCH /cart error:', err);
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// DELETE — remove by productId (or subdocument _id as fallback for old entries)
router.delete('/:email/:productId', auth, async (req, res) => {
  try {
    const { email, productId } = req.params;

    // Try pulling by bat's productId (new entries)
    let cart = await Cart.findOneAndUpdate(
      { userEmail: email },
      { $pull: { items: { productId } } },
      { new: true }
    );
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // If nothing was removed (item had no productId, e.g. old entry), try by subdocument _id
    const stillPresent = cart.items.some(i => i._id?.toString() === productId);
    if (stillPresent) {
      cart = await Cart.findOneAndUpdate(
        { userEmail: email },
        { $pull: { items: { _id: productId } } },
        { new: true }
      ) || cart;
    }

    res.json(withImgUrl(cart.items));
  } catch (err) {
    console.error('DELETE /cart error:', err);
    res.status(500).json({ message: 'Failed to remove item' });
  }
});

module.exports = router;
