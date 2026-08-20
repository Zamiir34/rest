import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    tableNumber: null,
    customerName: '',
    customerPhone: '',
  },
  reducers: {
    setTable: (state, action) => {
      state.tableNumber = action.payload;
    },
    setCustomerInfo: (state, action) => {
      state.customerName = action.payload.name;
      state.customerPhone = action.payload.phone || '';
    },
    addToCart: (state, action) => {
      const { food, quantity = 1, notes = '' } = action.payload;
      const price = food.discount
        ? food.price - (food.price * food.discount) / 100
        : food.price;
      const existing = state.items.find((i) => i.food._id === food._id);
      if (existing) {
        existing.quantity += quantity;
        if (notes) existing.notes = notes;
      } else {
        state.items.push({ food, price, quantity, notes });
      }
    },
    updateQuantity: (state, action) => {
      const item = state.items.find((i) => i.food._id === action.payload.foodId);
      if (item) {
        item.quantity = action.payload.quantity;
        if (item.quantity <= 0) {
          state.items = state.items.filter((i) => i.food._id !== action.payload.foodId);
        }
      }
    },
    updateNotes: (state, action) => {
      const item = state.items.find((i) => i.food._id === action.payload.foodId);
      if (item) item.notes = action.payload.notes;
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.food._id !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
      state.customerName = '';
      state.customerPhone = '';
    },
  },
});

export const {
  setTable, setCustomerInfo, addToCart, updateQuantity,
  updateNotes, removeFromCart, clearCart,
} = cartSlice.actions;

export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export default cartSlice.reducer;
