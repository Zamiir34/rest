require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const User = require('../models/User');
const Category = require('../models/Category');
const Food = require('../models/Food');
const Table = require('../models/Table');
const Settings = require('../models/Settings');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');
const Employee = require('../models/Employee');

const categories = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Drinks',
  'Desserts',
  'Fast Food',
  'Seafood',
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    await mongoose.connection.dropDatabase();
    console.log('Database cleared.');

    const settings = await Settings.create({
      restaurantName: 'Savory Bites Restaurant',
      address: '123 Main Street, Mogadishu',
      phone: '+252 61 123 4567',
      email: 'info@savorybites.com',
      taxRate: 5,
    });

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@restaurant.com',
      password: 'admin123',
      role: 'super_admin',
    });

    const manager = await User.create({
      name: 'John Manager',
      email: 'manager@restaurant.com',
      password: 'manager123',
      role: 'manager',
    });

    const chef = await User.create({
      name: 'Chef Ahmed',
      email: 'chef@restaurant.com',
      password: 'chef123',
      role: 'chef',
    });

    const cashier = await User.create({
      name: 'Sarah Cashier',
      email: 'cashier@restaurant.com',
      password: 'cashier123',
      role: 'cashier',
    });

    const waiter = await User.create({
      name: 'Ali Waiter',
      email: 'waiter@restaurant.com',
      password: 'waiter123',
      role: 'waiter',
    });

    const employeeData = [
      { user: manager._id, position: 'Manager', department: 'Management', salary: 2500 },
      { user: chef._id, position: 'Head Chef', department: 'Kitchen', salary: 2000 },
      { user: cashier._id, position: 'Cashier', department: 'Front Desk', salary: 1500 },
      { user: waiter._id, position: 'Waiter', department: 'Service', salary: 1200 },
    ];
    for (const emp of employeeData) {
      await Employee.create(emp);
    }

    const categoryDocs = [];
    for (let i = 0; i < categories.length; i++) {
      const doc = await Category.create({ name: categories[i], sortOrder: i });
      categoryDocs.push(doc);
    }

    const catMap = Object.fromEntries(categoryDocs.map((c) => [c.name, c._id]));

    const foods = [
      { name: 'Full English Breakfast', price: 12.99, category: catMap.Breakfast, isPopular: true, description: 'Eggs, bacon, sausage, beans, toast' },
      { name: 'Pancakes Stack', price: 8.99, category: catMap.Breakfast, description: 'Fluffy pancakes with maple syrup' },
      { name: 'Grilled Chicken Lunch', price: 14.99, category: catMap.Lunch, isPopular: true, description: 'Grilled chicken with rice and salad' },
      { name: 'Beef Steak Dinner', price: 24.99, category: catMap.Dinner, isFeatured: true, description: 'Premium beef steak with sides' },
      { name: 'Grilled Salmon', price: 22.99, category: catMap.Seafood, isPopular: true, description: 'Fresh grilled salmon with lemon butter' },
      { name: 'Fish & Chips', price: 13.99, category: catMap.Seafood, description: 'Classic battered fish with fries' },
      { name: 'Classic Burger', price: 10.99, category: catMap['Fast Food'], isPopular: true, description: 'Beef patty with cheese and fries' },
      { name: 'Margherita Pizza', price: 11.99, category: catMap['Fast Food'], description: 'Tomato, mozzarella, basil' },
      { name: 'Chocolate Lava Cake', price: 7.99, category: catMap.Desserts, isFeatured: true, description: 'Warm chocolate cake with molten center' },
      { name: 'Fresh Mango Smoothie', price: 5.99, category: catMap.Drinks, description: 'Blended fresh mango' },
      { name: 'Espresso', price: 3.49, category: catMap.Drinks, description: 'Double shot espresso' },
      { name: 'Iced Latte', price: 4.99, category: catMap.Drinks, description: 'Espresso with cold milk over ice' },
    ];

    await Food.insertMany(
      foods.map((f) => ({
        ...f,
        images: [`https://placehold.co/400x300?text=${encodeURIComponent(f.name)}`],
        isAvailable: true,
        createdBy: admin._id,
      }))
    );

    for (let i = 1; i <= 10; i++) {
      const tableNumber = `T${String(i).padStart(2, '0')}`;
      const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/menu/table/${tableNumber}`;
      const qrCode = await QRCode.toDataURL(url);
      await Table.create({
        tableNumber,
        capacity: i <= 4 ? 2 : i <= 7 ? 4 : 6,
        qrCode,
        qrCodeUrl: url,
        status: 'available',
      });
    }

    const supplier = await Supplier.create({
      name: 'Fresh Foods Supplier',
      contactPerson: 'Mohamed Ali',
      phone: '+252 61 999 8888',
      email: 'orders@freshfoods.com',
    });

    await Inventory.insertMany([
      { name: 'Chicken Breast', quantity: 50, unit: 'kg', minStock: 10, supplier: supplier._id, costPerUnit: 8 },
      { name: 'Beef', quantity: 30, unit: 'kg', minStock: 10, supplier: supplier._id, costPerUnit: 12 },
      { name: 'Salmon Fillet', quantity: 15, unit: 'kg', minStock: 5, supplier: supplier._id, costPerUnit: 18 },
      { name: 'Tomatoes', quantity: 8, unit: 'kg', minStock: 10, supplier: supplier._id, costPerUnit: 2 },
      { name: 'Olive Oil', quantity: 20, unit: 'liters', minStock: 5, supplier: supplier._id, costPerUnit: 6 },
    ]);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Login credentials:');
    console.log('  Admin:    admin@restaurant.com / admin123');
    console.log('  Manager:  manager@restaurant.com / manager123');
    console.log('  Chef:     chef@restaurant.com / chef123');
    console.log('  Cashier:  cashier@restaurant.com / cashier123');
    console.log('  Waiter:   waiter@restaurant.com / waiter123');
    console.log('\nQR Tables: T01 - T10');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
