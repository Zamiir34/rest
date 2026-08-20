const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');

exports.getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    $or: [{ recipient: req.user._id }, { recipientRole: req.user.role }],
  };
  if (req.query.unread === 'true') filter.isRead = false;

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResponse(notifications, total, page, limit) });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, data: notification });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {
      $or: [{ recipient: req.user._id }, { recipientRole: req.user.role }],
      isRead: false,
    },
    { isRead: true }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Notification deleted' });
});
