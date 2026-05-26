// This middleware runs AFTER auth.js (auth must run first to set req.user).
// It checks if the logged-in user has the admin role.
// Used to protect routes that only admins should access.
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin access only.' });
  }
  next();
};

module.exports = adminOnly;
