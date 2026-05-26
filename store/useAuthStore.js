import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(persist(
  (set) => ({
    user: null,
    isLoggedIn: false,
    token: null,      // <-- JWT token stored here
    cartCount: 0,

    // Called after successful login — stores user info AND the token
    login: (user, token) => set({ user, isLoggedIn: true, token }),

    // Called on logout — clears everything including the token
    logout: () => set({ user: null, isLoggedIn: false, token: null, cartCount: 0 }),

    setCartCount: (count) => set({ cartCount: count }),
  }),
  {
    name: 'auth-store',
    getStorage: () => localStorage,
  }
));

export default useAuthStore;
