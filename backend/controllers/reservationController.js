const asyncHandler = require('../utils/asyncHandler');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');

// Helper: get restaurantId filter based on user role
const getRestaurantFilter = (user, query) => {
  const queryRestId = query?.restaurantId || query?.restaurant;
  if (queryRestId) return { restaurant: queryRestId };

  if (!user) return {};
  if (user.role === 'super_admin') {
    return queryRestId ? { restaurant: queryRestId } : {};
  }
  const restId = user.restaurantId?._id || user.restaurantId;
  if (restId) return { restaurant: restId };
  return { restaurant: null };
};

exports.getReservations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { ...getRestaurantFilter(req.user, req.query) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) {
    const date = new Date(req.query.date);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    filter.date = { $gte: date, $lt: nextDay };
  }

  const [reservations, total] = await Promise.all([
    Reservation.find(filter).populate('table').sort('date time').skip(skip).limit(limit),
    Reservation.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResponse(reservations, total, page, limit) });
});

exports.createReservation = asyncHandler(async (req, res) => {
  const restaurantId =
    req.user?.role !== 'super_admin'
      ? req.user?.restaurantId?._id || req.user?.restaurantId
      : req.body.restaurant || req.user?.restaurantId?._id || req.user?.restaurantId;

  const reservation = await Reservation.create({
    ...req.body,
    restaurant: restaurantId,
    createdBy: req.user?._id,
  });

  if (reservation.table) {
    await Table.findByIdAndUpdate(reservation.table, { status: 'reserved' });
  }

  await createNotification({
    title: 'New Reservation',
    message: `${reservation.customerName} - ${reservation.guests} guests on ${reservation.date}`,
    type: 'reservation',
    recipientRole: 'manager',
    relatedId: reservation._id,
    relatedModel: 'Reservation',
  });

  req.app.get('io')?.emit('new_reservation', reservation);

  res.status(201).json({ success: true, data: reservation });
});

exports.updateReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('table');
  if (!reservation) throw new ApiError(404, 'Reservation not found');
  res.json({ success: true, data: reservation });
});

exports.deleteReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findByIdAndDelete(req.params.id);
  if (!reservation) throw new ApiError(404, 'Reservation not found');
  if (reservation.table) {
    await Table.findByIdAndUpdate(reservation.table, { status: 'available' });
  }
  res.json({ success: true, message: 'Reservation cancelled' });
});
