const asyncHandler = require('../utils/asyncHandler');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Order = require('../models/Order');
const Food = require('../models/Food');
const Table = require('../models/Table');
const Employee = require('../models/Employee');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const { getPagination, paginateResponse } = require('../utils/pagination');

// ── GET /api/restaurants ─────────────────────────────────────────────
exports.getRestaurants = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }
  if (req.query.subscriptionPlan && req.query.subscriptionPlan !== 'all') {
    filter.subscriptionPlan = req.query.subscriptionPlan;
  }
  if (req.query.search) {
    const s = req.query.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { code: { $regex: s, $options: 'i' } },
      { city: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { ownerName: { $regex: s, $options: 'i' } },
    ];
  }

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter)
      .populate('owner', 'name email phone avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Restaurant.countDocuments(filter),
  ]);

  // Augment each restaurant with live metrics
  const enhancedRestaurants = await Promise.all(
    restaurants.map(async (rest) => {
      const restObj = rest.toObject();

      const [foodCount, orderCount, tableCount, employeeCount, payments] = await Promise.all([
        Food.countDocuments({ restaurant: rest._id }),
        Order.countDocuments({ restaurant: rest._id }),
        Table.countDocuments({ restaurant: rest._id }),
        Employee.countDocuments({ restaurant: rest._id }),
        Order.aggregate([
          { $match: { restaurant: rest._id, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);

      const totalRevenue = payments[0]?.total || 0;

      return {
        ...restObj,
        stats: {
          foodCount,
          orderCount,
          tableCount,
          employeeCount,
          totalRevenue,
        },
      };
    })
  );

  res.json({
    success: true,
    ...paginateResponse(enhancedRestaurants, total, page, limit),
  });
});

// ── GET /api/restaurants/overview ────────────────────────────────────
exports.getPlatformOverview = asyncHandler(async (req, res) => {
  const [
    totalRestaurants,
    activeRestaurants,
    inactiveRestaurants,
    suspendedRestaurants,
    totalPlatformOrders,
    totalFoods,
    totalEmployees,
    revenueAgg,
    plansAgg,
  ] = await Promise.all([
    Restaurant.countDocuments(),
    Restaurant.countDocuments({ status: 'active' }),
    Restaurant.countDocuments({ status: 'inactive' }),
    Restaurant.countDocuments({ status: 'suspended' }),
    Order.countDocuments(),
    Food.countDocuments(),
    Employee.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Restaurant.aggregate([
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
    ]),
  ]);

  const totalPlatformRevenue = revenueAgg[0]?.total || 0;

  const planBreakdown = {};
  plansAgg.forEach((p) => {
    planBreakdown[p._id || 'unknown'] = p.count;
  });

  res.json({
    success: true,
    data: {
      totalRestaurants,
      activeRestaurants,
      inactiveRestaurants,
      suspendedRestaurants,
      totalPlatformOrders,
      totalPlatformRevenue,
      totalFoods,
      totalEmployees,
      planBreakdown,
    },
  });
});

// ── GET /api/restaurants/:id ─────────────────────────────────────────
exports.getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).populate(
    'owner',
    'name email phone avatar role isActive'
  );

  if (!restaurant) {
    throw new ApiError(404, 'Maqayadda lama helin (Restaurant not found)');
  }

  const [foodCount, orderCount, tableCount, employeeCount, revenueAgg, recentOrders, staff] =
    await Promise.all([
      Food.countDocuments({ restaurant: restaurant._id }),
      Order.countDocuments({ restaurant: restaurant._id }),
      Table.countDocuments({ restaurant: restaurant._id }),
      Employee.countDocuments({ restaurant: restaurant._id }),
      Order.aggregate([
        { $match: { restaurant: restaurant._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.find({ restaurant: restaurant._id })
        .sort('-createdAt')
        .limit(10)
        .populate('table', 'tableNumber'),
      User.find({ restaurantId: restaurant._id }).select('name email phone role isActive avatar'),
    ]);

  const totalRevenue = revenueAgg[0]?.total || 0;

  res.json({
    success: true,
    data: {
      ...restaurant.toObject(),
      stats: {
        foodCount,
        orderCount,
        tableCount,
        employeeCount,
        totalRevenue,
      },
      recentOrders,
      staff,
    },
  });
});

// ── POST /api/restaurants ────────────────────────────────────────────
exports.createRestaurant = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    email,
    phone,
    address,
    city,
    currency,
    taxRate,
    subscriptionPlan,
    subscriptionExpiresAt,
    notes,
    status,
    // Admin creation fields
    createAdmin,
    adminName,
    adminEmail,
    adminPassword,
    adminPhone,
  } = req.body;

  if (!name) {
    throw new ApiError(400, 'Magaca maqayadda waa waajib (Restaurant name is required)');
  }

  // Create restaurant doc
  const restaurant = new Restaurant({
    name,
    code: code ? code.toUpperCase().trim() : undefined,
    email,
    phone,
    address,
    city: city || 'Mogadishu',
    currency: currency || 'USD',
    taxRate: taxRate !== undefined ? Number(taxRate) : 5,
    subscriptionPlan: subscriptionPlan || 'pro',
    subscriptionExpiresAt,
    notes,
    status: status || 'active',
  });

  await restaurant.save();

  // Optionally create Restaurant Admin user
  let createdAdminUser = null;
  if (createAdmin && adminEmail && adminPassword) {
    const existing = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existing) {
      throw new ApiError(400, `Email-ka ${adminEmail} horay ayaa loo diiwaangeliyay (Email already exists)`);
    }

    createdAdminUser = await User.create({
      name: adminName || `${name} Admin`,
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,
      phone: adminPhone || phone,
      role: 'restaurant_admin',
      restaurantId: restaurant._id,
      isActive: true,
    });

    restaurant.owner = createdAdminUser._id;
    restaurant.ownerName = createdAdminUser.name;
    restaurant.ownerEmail = createdAdminUser.email;
    await restaurant.save();
  }

  res.status(201).json({
    success: true,
    message: 'Maqayadda si guul leh ayaa loo diiwaangeliyay',
    data: {
      restaurant,
      adminUser: createdAdminUser
        ? {
            id: createdAdminUser._id,
            name: createdAdminUser.name,
            email: createdAdminUser.email,
            role: createdAdminUser.role,
          }
        : null,
    },
  });
});

// ── PUT /api/restaurants/:id ─────────────────────────────────────────
exports.updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    throw new ApiError(404, 'Maqayadda lama helin (Restaurant not found)');
  }

  const updatableFields = [
    'name',
    'email',
    'phone',
    'address',
    'city',
    'currency',
    'taxRate',
    'subscriptionPlan',
    'subscriptionExpiresAt',
    'notes',
    'status',
    'logo',
    'owner',
    'ownerName',
    'ownerEmail',
  ];

  updatableFields.forEach((f) => {
    if (req.body[f] !== undefined) {
      restaurant[f] = req.body[f];
    }
  });

  // If status is set to inactive or suspended, optionally update staff
  if (req.body.status && req.body.status !== 'active') {
    // Keep user state or flag
  }

  await restaurant.save();

  res.json({
    success: true,
    message: 'Xogta maqayadda waa la cusbooneysiiyay',
    data: restaurant,
  });
});

// ── PATCH /api/restaurants/:id/status ────────────────────────────────
exports.updateRestaurantStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'suspended'].includes(status)) {
    throw new ApiError(400, 'Xaaladdu waa in ay noqotaa: active, inactive, ama suspended');
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!restaurant) {
    throw new ApiError(404, 'Maqayadda lama helin (Restaurant not found)');
  }

  res.json({
    success: true,
    message: `Xaaladda maqayadda waxaa laga dhigay: ${status}`,
    data: restaurant,
  });
});

// ── DELETE /api/restaurants/:id ──────────────────────────────────────
exports.deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    throw new ApiError(404, 'Maqayadda lama helin (Restaurant not found)');
  }

  // Deactivate or delete
  await Restaurant.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Maqayadda si buuxda ayaa loo tiray (Restaurant deleted successfully)',
  });
});

// ── GET /api/restaurants/:id/stats ───────────────────────────────────
exports.getRestaurantStats = asyncHandler(async (req, res) => {
  const restId = req.params.id;

  const [popularFoods, salesByDay, ordersByStatus] = await Promise.all([
    Order.aggregate([
      { $match: { restaurant: restId } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.food',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),
    Order.aggregate([
      { $match: { restaurant: restId, paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 14 },
    ]),
    Order.aggregate([
      { $match: { restaurant: restId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      popularFoods,
      salesByDay,
      ordersByStatus,
    },
  });
});
