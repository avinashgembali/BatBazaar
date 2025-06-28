const express = require('express');
const User = require('../models/user');

const router = express.Router();

// GET all users
router.get('/user', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // In production, use hashed passwords with bcrypt
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// routes/userRoutes.js
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = new User({ username, email, password }); // hash password later
    await user.save();

    res.status(201).json({ message: 'User registered successfully', user: { username, email } });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});


module.exports = router;
