// src/store/useAuthStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(persist(
  (set) => ({
    user: null,
    isLoggedIn: false,

    login: (user) => set({ user, isLoggedIn: true }),
    logout: () => set({ user: null, isLoggedIn: false }),
  }),
  {
    name: 'auth-store', // localStorage key
    getStorage: () => localStorage,
  }
));

export default useAuthStore;
