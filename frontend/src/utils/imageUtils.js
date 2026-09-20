const FOOD_FALLBACKS = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
  pancake: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=600&q=80',
  chicken: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
  steak: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
  beef: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
  salmon: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
  fish: 'https://images.unsplash.com/photo-1579208030886-b937da0925dc?auto=format&fit=crop&w=600&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  pizza: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
  dessert: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
  cake: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
  smoothie: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=600&q=80',
  mango: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=600&q=80',
  espresso: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
  coffee: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
  latte: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  drink: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
};

/**
 * Returns a guaranteed valid, appetizing image URL for a food item.
 * Filters out broken or flaky placehold.co images and assigns relevant Unsplash photography.
 */
export const getFoodImageUrl = (food) => {
  if (!food) return FOOD_FALLBACKS.default;
  const rawImg = food.images?.[0] || food.image;
  if (rawImg && typeof rawImg === 'string' && !rawImg.includes('placehold.co') && rawImg.startsWith('http')) {
    return rawImg;
  }
  const name = (food.name || '').toLowerCase();
  for (const [key, url] of Object.entries(FOOD_FALLBACKS)) {
    if (name.includes(key)) return url;
  }
  return FOOD_FALLBACKS.default;
};

/**
 * Image onError fallback handler to ensure no broken image icon is ever rendered.
 */
export const handleImageError = (e, food) => {
  e.target.onerror = null;
  const name = (food?.name || '').toLowerCase();
  for (const [key, url] of Object.entries(FOOD_FALLBACKS)) {
    if (name.includes(key)) {
      e.target.src = url;
      return;
    }
  }
  e.target.src = FOOD_FALLBACKS.default;
};
