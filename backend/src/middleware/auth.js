const { verifyToken } = require('../utils/jwtUtils');
const logger = require('../config/logger');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'No token provided' });
    }

    // For development, accept a special mock token
    if (process.env.NODE_ENV === 'development' && token === 'mock-auth-token') {
      req.user = {
        userId: '1',
        role: 'ADMIN'
      };
      return next();
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ status: 'error', message: 'Authentication failed' });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};