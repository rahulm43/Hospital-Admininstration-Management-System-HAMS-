const User = require('../models/User');
const { hashPassword, comparePassword, isPasswordStrong } = require('../utils/passwordUtils');
const { generateAccessToken, generateRefreshToken, verifyToken, generatePasswordResetToken } = require('../utils/jwtUtils');
const { AppError } = require('../utils/errorHandler');
const auditLog = require('../middleware/auditMiddleware');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'RECEPTIONIST', department } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Missing required fields', 400);
    }

    if (!isPasswordStrong(password)) {
      throw new AppError('Password must be at least 8 characters with uppercase, lowercase, number, and special character', 400);
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      department,
    });

    await auditLog(user.id, 'User', user.id, 'CREATE', null, { name, email, role }, req);

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password required', 400);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is not active', 403);
    }

    user.lastLogin = new Date();
    await user.save();

    await auditLog(user.id, 'User', user.id, 'LOGIN', null, null, req);

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newAccessToken = generateAccessToken(user.id, user.role);

    res.json({
      status: 'success',
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await auditLog(req.user.userId, 'User', req.user.userId, 'LOGOUT', null, null, req);
    res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    if (!isPasswordStrong(newPassword)) {
      throw new AppError('Password must be at least 8 characters with uppercase, lowercase, number, and special character', 400);
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await auditLog(userId, 'User', userId, 'UPDATE', { field: 'password' }, { field: 'password' }, req);

    res.json({ status: 'success', message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ status: 'success', message: 'If email exists, password reset link will be sent' });
    }

    const resetToken = generatePasswordResetToken(user.id);
    // TODO: Send email with reset token

    res.json({ status: 'success', message: 'Password reset link sent to email' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'password-reset') {
      throw new AppError('Invalid or expired reset token', 401);
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!isPasswordStrong(newPassword)) {
      throw new AppError('Password must be at least 8 characters with uppercase, lowercase, number, and special character', 400);
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await auditLog(user.id, 'User', user.id, 'UPDATE', { field: 'password' }, { field: 'password' }, req);

    res.json({ status: 'success', message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
