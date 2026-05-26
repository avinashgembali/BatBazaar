const jwt = require('jsonwebtoken');

// This middleware runs before any protected route handler.
// It reads the token from the request header, verifies it,
// and attaches the decoded user info to req.user so routes can use it.
const auth = (req, res, next) => {
  // The frontend sends: Authorization: "Bearer eyJhbGci..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Split "Bearer <token>" and take the token part
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify() decodes the token AND checks it hasn't been tampered with
    // If it fails (wrong secret, expired), it throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded looks like: { userId, email, role, iat, exp }
    req.user = decoded;

    next(); // Token is valid — continue to the actual route handler
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = auth;