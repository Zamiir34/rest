const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

exports.getCategories = asyncHandler(async (req, res) => {
  const filter = req.query.active === 'false' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort('sortOrder name');
  res.json({ success: true, data: categories });
});

exports.getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, message: 'Category deleted' });
});
