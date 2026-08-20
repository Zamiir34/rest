const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const User = require('../models/User');

exports.register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  res.status(201).json({
    success: true,
    data: { user, accessToken, refreshToken },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.json({
    success: true,
    data: { user, accessToken, refreshToken },
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const tokens = await authService.refreshAccessToken(req.body.refreshToken);
  res.json({ success: true, data: tokens });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  res.json({ success: true, message: 'Logged out successfully' });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.json({ success: true, message: 'Password reset email sent' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  res.json({ success: true, message: 'Password reset successful' });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password -refreshToken');
  res.json({ success: true, data: users });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  }).select('-password');
  res.json({ success: true, data: user });
});
