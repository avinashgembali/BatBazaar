const express = require('express');
const Bat = require('../models/bat');
const SoldBat = require('../models/soldBat');
const Order = require('../models/order');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// All admin routes require: valid token (auth) + admin role (adminOnly)
// The two middlewares run in order before the handler

router.post('/bat', auth, adminOnly, upload.single('img'), async (req, res) => {
  try {
    const { name, type, brand, rating, price } = req.body;
    let imageUrl = '';

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'batbazaar' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url;
    }

    const bat = new Bat({ name, type, brand, rating, price, img: imageUrl || req.body.img });
    await bat.save();
    res.status(201).json(bat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/bat/:id', auth, adminOnly, async (req, res) => {
  try {
    await Bat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bat deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sold', auth, adminOnly, async (req, res) => {
  try {
    const sold = await SoldBat.find().populate('batId');
    res.json(sold);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders', auth, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.put('/orders/:id/deliver', auth, adminOnly, async (req, res) => {
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
