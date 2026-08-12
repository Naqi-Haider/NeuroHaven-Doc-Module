import { create } from "zustand";
import { Doctor } from "@/types/doctor";

interface AuthState {
  user: Doctor | null;
  token: string | null;
  loading: boolean;
  setSession: (user: Doctor | null, token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,
  setSession: (user, token) => {
    if (typeof window !== "undefined" && token) {
      localStorage.setItem("nh-token", token);
      if (user) {
        localStorage.setItem("nh-user", JSON.stringify(user));
      }
    }
    set({ user, token, loading: false });
  },
  setLoading: (loading) => set({ loading }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nh-token");
      localStorage.removeItem("nh-user");
    }
    set({ user: null, token: null, loading: false });
  },
}));
