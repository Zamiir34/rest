const asyncHandler = require('../utils/asyncHandler');
const Food = require('../models/Food');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');
const { uploadMultiple } = require('../services/cloudinaryService');

exports.getFoods = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.category) filter.category = req.query.category;
  if (req.query.isAvailable !== undefined) filter.isAvailable = req.query.isAvailable === 'true';
  if (req.query.isPopular) filter.isPopular = true;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const sort = req.query.sort || '-createdAt';
  const [foods, total] = await Promise.all([
    Food.find(filter).populate('category').sort(sort).skip(skip).limit(limit),
    Food.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginateResponse(foods, total, page, limit) });
});

exports.getFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id).populate('category');
  if (!food) throw new ApiError(404, 'Food not found');
  res.json({ success: true, data: food });
});

exports.createFood = asyncHandler(async (req, res) => {
  const data = { ...req.body, createdBy: req.user._id };
  if (req.files?.length) {
    data.images = await uploadMultiple(req.files, 'foods');
  }
  const food = await Food.create(data);
  res.status(201).json({ success: true, data: food });
});

exports.updateFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);
  if (!food) throw new ApiError(404, 'Food not found');

  Object.assign(food, req.body);
  if (req.files?.length) {
    const newImages = await uploadMultiple(req.files, 'foods');
    food.images = [...(food.images || []), ...newImages];
  }
  await food.save();
  res.json({ success: true, data: food });
});

exports.deleteFood = asyncHandler(async (req, res) => {
  const food = await Food.findByIdAndDelete(req.params.id);
  if (!food) throw new ApiError(404, 'Food not found');
  res.json({ success: true, message: 'Food deleted' });
});
