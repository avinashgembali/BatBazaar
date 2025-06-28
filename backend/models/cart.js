const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId, // optional: link to Bat
  name: String,
  type: String,
  rating: Number,
  price: Number,
  img: String,
});

const cartSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
});

module.exports = mongoose.model('Cart', cartSchema);
