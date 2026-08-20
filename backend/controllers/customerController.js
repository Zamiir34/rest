const asyncHandler = require('../utils/asyncHandler');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');

exports.getCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter).sort('-totalSpending').skip(skip).limit(limit),
    Customer.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResponse(customers, total, page, limit) });
});

exports.getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).populate('favoriteFoods');
  if (!customer) throw new ApiError(404, 'Customer not found');

  const orders = await Order.find({ customer: customer._id })
    .sort('-createdAt')
    .limit(20);

  res.json({ success: true, data: { customer, orders } });
});

exports.updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ success: true, data: customer });
});

exports.deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ success: true, message: 'Customer deleted' });
});
