const express = require('express');
const Bat = require('../models/bat');
const SoldBat = require('../models/soldBat');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Order = require('../models/order');

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create Bat
router.post('/bat', upload.single('img'), async (req, res) => {
  try {
    const { name, type, brand, rating, price } = req.body;
    let imageUrl = '';

    if (req.file) {
      
      // Wrap cloudinary upload in a promise
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'batbazaar' },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return reject(error);
            }
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    const bat = new Bat({
      name,
      type,
      brand,
      rating,
      price,
      img: imageUrl || req.body.img, // fallback if needed
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
