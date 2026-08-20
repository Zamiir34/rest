const asyncHandler = require('../utils/asyncHandler');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');
const { createNotification } = require('../services/notificationService');

exports.getReservations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
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
  const reservation = await Reservation.create({
    ...req.body,
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
