import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(persist(
  (set) => ({
    user: null,
    isLoggedIn: false,
    token: null,
    cartCount: 0,
    cartItems: [],

    login: (user, token) => set({ user, isLoggedIn: true, token }),
    logout: () => set({ user: null, isLoggedIn: false, token: null, cartCount: 0, cartItems: [] }),

    setCartCount: (count) => set({ cartCount: count }),

    // Single source of truth — always updates both items and badge count together
    setCartItems: (items) => set({ cartItems: items, cartCount: items.length }),
  }),
  {
    name: 'auth-store',
    getStorage: () => localStorage,
    // cartItems is intentionally excluded — always fetched fresh from API
    partialize: (state) => ({
      user: state.user,
      isLoggedIn: state.isLoggedIn,
      token: state.token,
      cartCount: state.cartCount,
    }),
  }
));

export default useAuthStore;
