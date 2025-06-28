// models/Bat.js
const mongoose = require('mongoose');

const batSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Kashmir-Willow', 'English Willow', 'Poplar Willow'],
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  img: {
    type: String,
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bat', batSchema);
