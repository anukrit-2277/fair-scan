const jwt = require('jsonwebtoken');
const { env } = require('../config');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

const sendTokenResponse = (res, user, statusCode = 200) => {
  const token = generateToken(user);

  res.cookie('token', token, cookieOptions());

  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };

  return res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'Account created' : 'Logged in',
    data: { user: safeUser, token },
  });
};

module.exports = { generateToken, cookieOptions, sendTokenResponse };
