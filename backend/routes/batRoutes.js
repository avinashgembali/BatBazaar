const express = require('express');
const multer = require('multer');
const path = require('path');
const Bat = require('../models/bat');

const router = express.Router();

// // Multer config
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });
// const upload = multer({ storage });

// GET all bats
router.get('/bat', async (req, res) => {
  try {
    const bats = await Bat.find();

    const fullBats = bats.map(b => ({
      ...b.toObject(),
      imgUrl: b.img,
    }));

    res.json(fullBats);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});


module.exports = router;
