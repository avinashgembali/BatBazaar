const express = require('express');
const Bat = require('../models/bat');
const SoldBat = require('../models/soldBat');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Order = require('../models/order');

// Configure Multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// Create Bat
router.post('/bat', upload.single('img'), async (req, res) => {
  try {
    const { name, type, brand, rating, price } = req.body;

    const bat = new Bat({
      name,
      type,
      brand,
      rating,
      price,
      img: req.file.filename, // <-- Multer stores this
    });

    await bat.save();
    res.status(201).json(bat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Bat
router.delete('/bat/:id', async (req, res) => {
  try {
    await Bat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bat deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// View Sold Bats
router.get('/sold', async (req, res) => {
  try {
    const sold = await SoldBat.find().populate('batId');
    res.json(sold);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Mark order as delivered and move to sold bats
router.put('/orders/:id/deliver', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'delivered';
    order.deliveredDate = new Date();
    await order.save();

    res.json({ message: 'Order marked as delivered', order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

module.exports = router;
