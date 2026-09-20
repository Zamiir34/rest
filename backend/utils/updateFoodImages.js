const mongoose = require('mongoose');

const FOOD_IMAGE_MAP = {
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

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant_pos');
  console.log('Connected to MongoDB');

  const foodsCollection = mongoose.connection.db.collection('foods');
  const foods = await foodsCollection.find({}).toArray();

  let updatedCount = 0;
  for (const food of foods) {
    const newImage = FOOD_IMAGE_MAP[food.name] || DEFAULT_FOOD_IMAGE;
    // Replace if it has placehold.co or empty images
    const currentImg = food.images?.[0] || '';
    if (!currentImg || currentImg.includes('placehold.co')) {
      await foodsCollection.updateOne(
        { _id: food._id },
        { $set: { images: [newImage] } }
      );
      console.log(`Updated ${food.name} -> ${newImage}`);
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} food images!`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
