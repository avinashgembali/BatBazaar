const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

// ─── REGISTER ────────────────────────────────────────────────────────────────
// What happens here:
// 1. Check if email is already used
// 2. Hash the password with bcrypt (never store plain text)
// 3. Save the user with the hashed password
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    // bcrypt.hash turns "mypassword" → "$2b$10$randomsalt...hashedvalue"
    // The "10" means it runs 2^10 = 1024 hashing rounds (industry standard)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// What happens here:
// 1. Find the user by email
// 2. Use bcrypt.compare to check the password against the stored hash
// 3. If valid, create a JWT token and send it back to the frontend
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    // bcrypt.compare safely checks "mypassword" against "$2b$10$..."
    // Returns true if they match, false if not
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // jwt.sign() creates a signed token.
    // Payload = the data we embed inside the token (readable by anyone)
    // Secret  = our private key that proves the token came from us
    // expiresIn = token auto-expires after 7 days
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,  // <-- frontend stores this and sends it with every future request
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

module.exports = router;
