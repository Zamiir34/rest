const Notification = require('../models/Notification');

const createNotification = async ({
  title,
  message,
  type = 'system',
  recipient,
  recipientRole,
  relatedId,
  relatedModel,
  priority = 'medium',
}) => {
  return Notification.create({
    title,
    message,
    type,
    recipient,
    recipientRole,
    relatedId,
    relatedModel,
    priority,
  });
};

const notifyRoles = async (roles, payload) => {
  const notifications = roles.map((role) =>
    createNotification({ ...payload, recipientRole: role })
  );
  return Promise.all(notifications);
};

module.exports = { createNotification, notifyRoles };
