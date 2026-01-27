import { create } from "zustand";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  set_user: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  load_user: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  set_user: (user) => set({ user }),
  login: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem("user");
    set({ user: null });
  },
  load_user: () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      set({ user: JSON.parse(storedUser), isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
