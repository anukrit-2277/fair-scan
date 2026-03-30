const { User } = require('../models');
const { asyncHandler } = require('../utils');
const { sendTokenResponse, cookieOptions } = require('../utils/token');
const { AppError } = require('../middleware');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, organization } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await User.create({ name, email, password, organization });

  sendTokenResponse(res, user, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  sendTokenResponse(res, user, 200);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user },
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.cookie('token', '', { ...cookieOptions(), maxAge: 0 });

  res.json({ success: true, message: 'Logged out' });
});

module.exports = { register, login, getMe, logout };
