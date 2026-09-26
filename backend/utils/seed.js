require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const Food = require('../models/Food');
const Table = require('../models/Table');
const Settings = require('../models/Settings');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');
const Employee = require('../models/Employee');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    await mongoose.connection.dropDatabase();
    console.log('Database cleared.');

    // 1. Create Restaurants
    const restaurant1 = await Restaurant.create({
      name: 'Savory Bites Restaurant',
      code: 'REST-001',
      email: 'info@savorybites.com',
      phone: '+252 61 123 4567',
      address: '123 Maka Al-Mukarama Street',
      city: 'Mogadishu',
      status: 'active',
      subscriptionPlan: 'enterprise',
      currency: 'USD',
      taxRate: 5,
      notes: 'Main flagship restaurant branch in Mogadishu',
    });

    const restaurant2 = await Restaurant.create({
      name: 'Somali Flavors & Grill',
      code: 'REST-002',
      email: 'contact@somaliflavors.so',
      phone: '+252 63 444 8888',
      address: '45 Independence Avenue',
      city: 'Hargeisa',
      status: 'active',
      subscriptionPlan: 'pro',
      currency: 'USD',
      taxRate: 5,
      notes: 'Premium grill & authentic traditional Somali dishes',
    });

    const restaurant3 = await Restaurant.create({
      name: 'Ocean Breeze Seafood Cafe',
      code: 'REST-003',
      email: 'oceanbreeze@kismayo.com',
      phone: '+252 69 777 9999',
      address: 'Port Beach Road',
      city: 'Kismayo',
      status: 'suspended',
      subscriptionPlan: 'basic',
      currency: 'USD',
      taxRate: 4,
      notes: 'Beachfront seafood cafe - subscription pending renewal',
    });

    // 2. Create Users
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@restaurant.com',
      password: 'admin123',
      role: 'super_admin',
    });

    const adminSavory = await User.create({
      name: 'Hassan Adan (Savory Admin)',
      email: 'admin.savory@restaurant.com',
      password: 'admin123',
      role: 'restaurant_admin',
      restaurantId: restaurant1._id,
    });
    restaurant1.owner = adminSavory._id;
    restaurant1.ownerName = adminSavory.name;
    restaurant1.ownerEmail = adminSavory.email;
    await restaurant1.save();

    const adminFlavors = await User.create({
      name: 'Khadija Omar (Flavors Admin)',
      email: 'admin.flavors@restaurant.com',
      password: 'admin123',
      role: 'restaurant_admin',
      restaurantId: restaurant2._id,
    });
    restaurant2.owner = adminFlavors._id;
    restaurant2.ownerName = adminFlavors.name;
    restaurant2.ownerEmail = adminFlavors.email;
    await restaurant2.save();

    const manager = await User.create({
      name: 'John Manager',
      email: 'manager@restaurant.com',
      password: 'manager123',
      role: 'manager',
      restaurantId: restaurant1._id,
    });

    const chef = await User.create({
      name: 'Chef Ahmed',
      email: 'chef@restaurant.com',
      password: 'chef123',
      role: 'chef',
      restaurantId: restaurant1._id,
    });

    const cashier = await User.create({
      name: 'Sarah Cashier',
      email: 'cashier@restaurant.com',
      password: 'cashier123',
      role: 'cashier',
      restaurantId: restaurant1._id,
    });

    const waiter = await User.create({
      name: 'Ali Waiter',
      email: 'waiter@restaurant.com',
      password: 'waiter123',
      role: 'waiter',
      restaurantId: restaurant1._id,
    });

    // 3. Settings (scoped to each restaurant)
    await Settings.create({
      restaurant: restaurant1._id,
      restaurantName: 'Savory Bites Restaurant',
      address: '123 Maka Al-Mukarama Street, Mogadishu',
      phone: '+252 61 123 4567',
      email: 'info@savorybites.com',
      currency: 'USD',
      taxRate: 5,
    });

    await Settings.create({
      restaurant: restaurant2._id,
      restaurantName: 'Somali Flavors & Grill',
      address: '45 Independence Avenue, Hargeisa',
      phone: '+252 63 444 8888',
      email: 'contact@somaliflavors.so',
      currency: 'USD',
      taxRate: 5,
    });

    // 4. Employees (Restaurant 1)
    const employeeData = [
      { user: manager._id, position: 'General Manager', department: 'Management', salary: 2500, restaurant: restaurant1._id },
      { user: chef._id, position: 'Head Chef', department: 'Kitchen', salary: 2000, restaurant: restaurant1._id },
      { user: cashier._id, position: 'Head Cashier', department: 'Front Desk', salary: 1500, restaurant: restaurant1._id },
      { user: waiter._id, position: 'Senior Waiter', department: 'Service', salary: 1200, restaurant: restaurant1._id },
    ];
    for (const emp of employeeData) {
      await Employee.create(emp);
    }

    // 5. Restaurant 1: Categories, Foods, Tables
    const catNames1 = ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Desserts', 'Fast Food', 'Seafood'];
    const categoryDocs1 = [];
    for (let i = 0; i < catNames1.length; i++) {
      const doc = await Category.create({ name: catNames1[i], sortOrder: i, restaurant: restaurant1._id });
      categoryDocs1.push(doc);
    }
    const catMap1 = Object.fromEntries(categoryDocs1.map((c) => [c.name, c._id]));

    const foods1 = [
      { name: 'Full English Breakfast', price: 12.99, category: catMap1.Breakfast, isPopular: true, description: 'Eggs, bacon, sausage, beans, toast', restaurant: restaurant1._id },
      { name: 'Pancakes Stack', price: 8.99, category: catMap1.Breakfast, description: 'Fluffy pancakes with maple syrup', restaurant: restaurant1._id },
      { name: 'Grilled Chicken Lunch', price: 14.99, category: catMap1.Lunch, isPopular: true, description: 'Grilled chicken with rice and salad', restaurant: restaurant1._id },
      { name: 'Beef Steak Dinner', price: 24.99, category: catMap1.Dinner, isFeatured: true, description: 'Premium beef steak with sides', restaurant: restaurant1._id },
      { name: 'Grilled Salmon', price: 22.99, category: catMap1.Seafood, isPopular: true, description: 'Fresh grilled salmon with lemon butter', restaurant: restaurant1._id },
      { name: 'Fish & Chips', price: 13.99, category: catMap1.Seafood, description: 'Classic battered fish with fries', restaurant: restaurant1._id },
      { name: 'Classic Burger', price: 10.99, category: catMap1['Fast Food'], isPopular: true, description: 'Beef patty with cheese and fries', restaurant: restaurant1._id },
      { name: 'Margherita Pizza', price: 11.99, category: catMap1['Fast Food'], description: 'Tomato, mozzarella, basil', restaurant: restaurant1._id },
      { name: 'Chocolate Lava Cake', price: 7.99, category: catMap1.Desserts, isFeatured: true, description: 'Warm chocolate cake with molten center', restaurant: restaurant1._id },
      { name: 'Fresh Mango Smoothie', price: 5.99, category: catMap1.Drinks, description: 'Blended fresh mango', restaurant: restaurant1._id },
      { name: 'Espresso', price: 3.49, category: catMap1.Drinks, description: 'Double shot espresso', restaurant: restaurant1._id },
      { name: 'Iced Latte', price: 4.99, category: catMap1.Drinks, description: 'Espresso with cold milk over ice', restaurant: restaurant1._id },
    ];

    const FOOD_IMAGES1 = {
      'Full English Breakfast': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
      'Pancakes Stack': 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=600&q=80',
      'Grilled Chicken Lunch': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
      'Beef Steak Dinner': 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
      'Grilled Salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
      'Fish & Chips': 'https://images.unsplash.com/photo-1579208030886-b937da0925dc?auto=format&fit=crop&w=600&q=80',
      'Classic Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      'Margherita Pizza': 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
      'Chocolate Lava Cake': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
      'Fresh Mango Smoothie': 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=600&q=80',
      'Espresso': 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
      'Iced Latte': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    };

    const createdFoods1 = await Food.insertMany(
      foods1.map((f) => ({
        ...f,
        images: [FOOD_IMAGES1[f.name] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'],
        isAvailable: true,
        createdBy: superAdmin._id,
      }))
    );

    const createdTables1 = [];
    for (let i = 1; i <= 10; i++) {
      const tableNumber = 'T' + String(i).padStart(2, '0');
      const url = (process.env.CLIENT_URL || 'http://localhost:5173') + '/menu/table/' + tableNumber;
      const qrCode = await QRCode.toDataURL(url);
      const t = await Table.create({
        tableNumber, capacity: i <= 4 ? 2 : i <= 7 ? 4 : 6,
        qrCode, qrCodeUrl: url,
        status: i === 1 ? 'occupied' : 'available',
        restaurant: restaurant1._id,
      });
      createdTables1.push(t);
    }

    const customer1 = await Customer.create({ name: 'Ahmed Yasin', phone: '+252 61 555 1234', restaurant: restaurant1._id });

    await Order.create({
      orderNumber: 'ORD-1001', orderType: 'dine_in',
      table: createdTables1[0]._id, tableNumber: 'T01',
      customer: customer1._id, customerName: customer1.name, customerPhone: customer1.phone,
      items: [
        { food: createdFoods1[2]._id, name: createdFoods1[2].name, price: createdFoods1[2].price, quantity: 2, subtotal: createdFoods1[2].price * 2 },
        { food: createdFoods1[9]._id, name: createdFoods1[9].name, price: createdFoods1[9].price, quantity: 2, subtotal: createdFoods1[9].price * 2 },
      ],
      subtotal: 41.96, tax: 2.10, total: 44.06, status: 'completed', paymentStatus: 'paid',
      restaurant: restaurant1._id,
    });

    await Order.create({
      orderNumber: 'ORD-1002', orderType: 'dine_in',
      table: createdTables1[1]._id, tableNumber: 'T02',
      customerName: 'Fatima Nur', customerPhone: '+252 61 888 4444',
      items: [{ food: createdFoods1[3]._id, name: createdFoods1[3].name, price: createdFoods1[3].price, quantity: 1, subtotal: createdFoods1[3].price }],
      subtotal: 24.99, tax: 1.25, total: 26.24, status: 'ready', paymentStatus: 'paid',
      restaurant: restaurant1._id,
    });

    // 6. Restaurant 2: Categories, Foods, Tables
    const catNames2 = ['Somali Dishes', 'Grills', 'Soups', 'Beverages', 'Desserts'];
    const categoryDocs2 = [];
    for (let i = 0; i < catNames2.length; i++) {
      const doc = await Category.create({ name: catNames2[i], sortOrder: i, restaurant: restaurant2._id });
      categoryDocs2.push(doc);
    }
    const catMap2 = Object.fromEntries(categoryDocs2.map((c) => [c.name, c._id]));

    const foods2 = [
      { name: 'Camel Stew & Rice', price: 18.00, category: catMap2['Somali Dishes'], isPopular: true, description: 'Traditional slow-cooked camel stew with basmati rice', restaurant: restaurant2._id },
      { name: 'Somali Hilib Ari', price: 15.00, category: catMap2['Somali Dishes'], description: 'Spiced goat meat with anjero bread', restaurant: restaurant2._id },
      { name: 'Grilled Tilapia', price: 20.00, category: catMap2.Grills, isPopular: true, description: 'Whole grilled tilapia with lemon and herbs', restaurant: restaurant2._id },
      { name: 'BBQ Lamb Chops', price: 22.00, category: catMap2.Grills, isFeatured: true, description: 'Marinated lamb chops grilled over charcoal', restaurant: restaurant2._id },
      { name: 'Somali Chicken Suqaar', price: 14.00, category: catMap2.Grills, description: 'Diced chicken stir-fried with peppers and spices', restaurant: restaurant2._id },
      { name: 'Beef Maraq', price: 10.00, category: catMap2.Soups, description: 'Hearty Somali beef bone broth soup', restaurant: restaurant2._id },
      { name: 'Vegetable Soup', price: 7.00, category: catMap2.Soups, description: 'Fresh seasonal vegetables in broth', restaurant: restaurant2._id },
      { name: 'Camel Milk Tea (Shaah)', price: 3.50, category: catMap2.Beverages, isPopular: true, description: 'Traditional spiced Somali tea with camel milk', restaurant: restaurant2._id },
      { name: 'Fresh Tamarind Juice', price: 4.00, category: catMap2.Beverages, description: 'Refreshing homemade tamarind drink', restaurant: restaurant2._id },
      { name: 'Bur (Somali Donuts)', price: 5.00, category: catMap2.Desserts, isFeatured: true, description: 'Sweet deep-fried dough balls with honey', restaurant: restaurant2._id },
    ];

    const FOOD_IMAGES2 = {
      'Camel Stew & Rice': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
      'Somali Hilib Ari': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      'Grilled Tilapia': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
      'BBQ Lamb Chops': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      'Somali Chicken Suqaar': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
      'Beef Maraq': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
      'Vegetable Soup': 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=600&q=80',
      'Camel Milk Tea (Shaah)': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80',
      'Fresh Tamarind Juice': 'https://images.unsplash.com/photo-1543253687-c931c8e01820?auto=format&fit=crop&w=600&q=80',
      'Bur (Somali Donuts)': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80',
    };

    const createdFoods2 = await Food.insertMany(
      foods2.map((f) => ({
        ...f,
        images: [FOOD_IMAGES2[f.name] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'],
        isAvailable: true,
        createdBy: adminFlavors._id,
      }))
    );

    const createdTables2 = [];
    for (let i = 1; i <= 8; i++) {
      const tableNumber = 'F' + String(i).padStart(2, '0');
      const url = (process.env.CLIENT_URL || 'http://localhost:5173') + '/menu/table/' + tableNumber;
      const qrCode = await QRCode.toDataURL(url);
      const t = await Table.create({
        tableNumber, capacity: i <= 3 ? 2 : i <= 6 ? 4 : 6,
        qrCode, qrCodeUrl: url, status: 'available',
        restaurant: restaurant2._id,
      });
      createdTables2.push(t);
    }

    const customer2 = await Customer.create({ name: 'Mustafa Jama', phone: '+252 63 999 1111', restaurant: restaurant2._id });

    await Order.create({
      orderNumber: 'ORD-2001', orderType: 'dine_in',
      table: createdTables2[0]._id, tableNumber: 'F01',
      customer: customer2._id, customerName: customer2.name, customerPhone: customer2.phone,
      items: [
        { food: createdFoods2[0]._id, name: createdFoods2[0].name, price: createdFoods2[0].price, quantity: 2, subtotal: createdFoods2[0].price * 2 },
        { food: createdFoods2[7]._id, name: createdFoods2[7].name, price: createdFoods2[7].price, quantity: 2, subtotal: createdFoods2[7].price * 2 },
      ],
      subtotal: 43.00, tax: 2.15, total: 45.15, status: 'completed', paymentStatus: 'paid',
      restaurant: restaurant2._id,
    });

    await Order.create({
      orderNumber: 'ORD-2002', orderType: 'takeaway',
      customerName: 'Hodan Farah', customerPhone: '+252 63 777 2222',
      items: [{ food: createdFoods2[3]._id, name: createdFoods2[3].name, price: createdFoods2[3].price, quantity: 1, subtotal: createdFoods2[3].price }],
      subtotal: 22.00, tax: 1.10, total: 23.10, status: 'preparing', paymentStatus: 'unpaid',
      restaurant: restaurant2._id,
    });

    // 7. Suppliers & Inventory
    const supplier1 = await Supplier.create({ name: 'Fresh Foods Supplier', contactPerson: 'Mohamed Ali', phone: '+252 61 999 8888', email: 'orders@freshfoods.com' });
    const supplier2 = await Supplier.create({ name: 'Hargeisa Halal Meats', contactPerson: 'Abdi Warsame', phone: '+252 63 111 5555', email: 'halal@hargeisa.so' });

    await Inventory.insertMany([
      { name: 'Chicken Breast', quantity: 50, unit: 'kg', minStock: 10, supplier: supplier1._id, costPerUnit: 8, restaurant: restaurant1._id },
      { name: 'Beef', quantity: 30, unit: 'kg', minStock: 10, supplier: supplier1._id, costPerUnit: 12, restaurant: restaurant1._id },
      { name: 'Salmon Fillet', quantity: 15, unit: 'kg', minStock: 5, supplier: supplier1._id, costPerUnit: 18, restaurant: restaurant1._id },
      { name: 'Tomatoes', quantity: 8, unit: 'kg', minStock: 10, supplier: supplier1._id, costPerUnit: 2, restaurant: restaurant1._id },
      { name: 'Olive Oil', quantity: 20, unit: 'liters', minStock: 5, supplier: supplier1._id, costPerUnit: 6, restaurant: restaurant1._id },
      { name: 'Camel Meat', quantity: 20, unit: 'kg', minStock: 5, supplier: supplier2._id, costPerUnit: 25, restaurant: restaurant2._id },
      { name: 'Lamb Chops', quantity: 25, unit: 'kg', minStock: 8, supplier: supplier2._id, costPerUnit: 20, restaurant: restaurant2._id },
      { name: 'Tilapia Fish', quantity: 30, unit: 'kg', minStock: 10, supplier: supplier2._id, costPerUnit: 10, restaurant: restaurant2._id },
      { name: 'Anjero Flour', quantity: 40, unit: 'kg', minStock: 15, supplier: supplier2._id, costPerUnit: 3, restaurant: restaurant2._id },
    ]);

    console.log('\n? Multi-tenant seed completed successfully!\n');
    console.log('Login credentials:');
    console.log('  Super Admin:          admin@restaurant.com / admin123');
    console.log('  Savory Bites Admin:   admin.savory@restaurant.com / admin123');
    console.log('  Somali Flavors Admin: admin.flavors@restaurant.com / admin123');
    console.log('  Manager:              manager@restaurant.com / manager123');
    console.log('  Chef:                 chef@restaurant.com / chef123');
    console.log('  Cashier:              cashier@restaurant.com / cashier123');
    console.log('  Waiter:               waiter@restaurant.com / waiter123');
    console.log('\nRestaurants:');
    console.log('  1. Savory Bites Restaurant (Mogadishu) - Active [Enterprise] - 12 foods, 7 cats, 10 tables');
    console.log('  2. Somali Flavors & Grill (Hargeisa) - Active [Pro] - 10 foods, 5 cats, 8 tables');
    console.log('  3. Ocean Breeze Seafood Cafe (Kismayo) - Suspended [Basic]');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
