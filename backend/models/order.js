const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: String,
    type: String,
    brand: String,
    rating: Number,
    price: Number,
    quantity: {
        type: Number,
        default: 1
    },
    img: String // image filename if needed
}, { _id: false });

const orderSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    items: {
        type: [itemSchema],
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'delivered'],
        default: 'pending'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    deliveredDate: {
        type: Date
    }
});

module.exports = mongoose.model('Order', orderSchema);
