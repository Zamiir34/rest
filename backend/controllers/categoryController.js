const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

// Helper: get restaurantId filter based on user role and query
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

exports.getCategories = asyncHandler(async (req, res) => {
  const restaurantFilter = getRestaurantFilter(req.user, req.query);
  const activeFilter = req.query.active === 'false' ? {} : { isActive: true };
  const filter = { ...restaurantFilter, ...activeFilter };
  const categories = await Category.find(filter).sort('sortOrder name');
  res.json({ success: true, data: categories });
});

exports.getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const restaurantId =
    req.user.role !== 'super_admin'
      ? req.user.restaurantId?._id || req.user.restaurantId
      : req.body.restaurant || req.user.restaurantId?._id || req.user.restaurantId;

  const data = {
    ...req.body,
    restaurant: restaurantId,
  };
  const category = await Category.create(data);
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
