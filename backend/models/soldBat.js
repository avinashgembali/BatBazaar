// models/SoldBat.js
const mongoose = require('mongoose');

const soldBatSchema = new mongoose.Schema({
  batId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bat',
    required: true
  },
  buyerEmail: {
    type: String,
    required: true
  },
  buyerUsername: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  soldAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SoldBat', soldBatSchema);
