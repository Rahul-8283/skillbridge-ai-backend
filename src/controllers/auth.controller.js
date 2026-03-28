const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../utils/validationSchemas');
const User = require('../models/user.model');
const { redisClient } = require('../config/redis');
const AppError = require('../utils/AppError');

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }

    const { email, password, role, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role,
      name,
    });

    const payload = { id: newUser._id, role: newUser.role };
    const { accessToken, refreshToken } = generateTokens(payload);

    await redisClient.set(newUser._id.toString(), refreshToken, 'EX', 60 * 60 * 24 * 30);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.status(201).json({
      status: 'success',
      accessToken,
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    console.log('Login attempt with:', { email: req.body.email });

    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return next(new AppError(error.details[0].message, 400));
    }

    const { email, password } = value;

    // Find user and explicitly select password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User not found:', email);
      return next(new AppError('User not found with this email', 401));
    }

    console.log('User found, comparing passwords...');

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Password comparison failed for user:', email);
      return next(new AppError('Incorrect password. Please try again.', 401));
    }

    console.log('Password valid, generating tokens...');

    const payload = { id: user._id, role: user.role };
    const { accessToken, refreshToken } = generateTokens(payload);

    await redisClient.set(user._id.toString(), refreshToken, 'EX', 60 * 60 * 24 * 30);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.status(200).json({
      status: 'success',
      accessToken,
      user,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return next(new AppError('Refresh token not found', 401));
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redisClient.get(decoded.id);

    if (!storedToken || storedToken !== refreshToken) {
      return next(new AppError('Invalid refresh token', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 401));
    }

    const payload = { id: user._id, role: user.role };
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);

    await redisClient.set(user._id.toString(), newRefreshToken, 'EX', 60 * 60 * 24 * 30);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.status(200).json({
      status: 'success',
      accessToken,
    });
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(204).send();
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    await redisClient.del(decoded.id);

    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};
