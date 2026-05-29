const express = require('express');
const Bat = require('../models/bat');

const router = express.Router();

// GET brand list + price range (used to initialise filter controls)
router.get('/stats', async (req, res) => {
  try {
    const bats = await Bat.find({}, 'name price');
    const brands = [...new Set(bats.map(b => b.name.toLowerCase()))].sort();
    const prices = bats.map(b => b.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 30000;
    res.json({ brands, minPrice, maxPrice });
  } catch (err) {
    console.error('GET /bats/stats error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET bats — filter · sort · paginate
// Query params:
//   brands     comma-separated lowercase names  e.g. mrf,ss
//   minPrice   number
//   maxPrice   number
//   minRating  number (0 = any)
//   sort       low-high | high-low
//   page       integer >= 1   (default 1)
//   limit      integer >= 1   (default 10, capped at 50)
router.get('/bat', async (req, res) => {
  try {
    const { brands, minPrice, maxPrice, minRating, sort, page = '1', limit = '10' } = req.query;

    const filter = {};

    if (brands) {
      const list = brands.split(',').map(b => b.trim()).filter(Boolean);
      if (list.length) filter.name = { $in: list.map(b => new RegExp(`^${b}$`, 'i')) };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    if (minRating !== undefined && Number(minRating) > 0) {
      filter.rating = { $gte: Number(minRating) };
    }

    const sortMap = { 'low-high': { price: 1 }, 'high-low': { price: -1 } };
    const sortObj = sortMap[sort] || {};

    const pageNum  = Math.max(1, parseInt(page,  10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [bats, totalCount] = await Promise.all([
      Bat.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Bat.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));

    res.json({
      bats: bats.map(b => ({ ...b.toObject(), imgUrl: b.img, stock: b.stock ?? 0 })),
      totalCount,
      totalPages,
      currentPage: pageNum,
    });
  } catch (err) {
    console.error('GET /bats/bat error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
