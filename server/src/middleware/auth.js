const jwt = require('jsonwebtoken');
const { env } = require('../config');
const { AppError } = require('./errorHandler');

const protect = (req, _res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError('Not authorized — no token provided', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Not authorized — invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Not authorized — token expired', 401));
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('Forbidden — insufficient permissions', 403));
    }
    next();
  };
};

module.exports = { protect, authorize };
