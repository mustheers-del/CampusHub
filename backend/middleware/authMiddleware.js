const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gvms_college_portal_secret_key_2026';

// Middleware to verify JWT token from Authorization header
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    req.user = null;
    return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
  }
};

// Middleware to require authentication (student or admin)
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Access denied. Please log in to continue.' });
  }
  next();
};

// Middleware to require Admin role only
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Access denied. Please log in as Admin.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Admin privileges required for this action.' });
  }

  next();
};

module.exports = {
  verifyToken,
  requireAuth,
  requireAdmin
};
