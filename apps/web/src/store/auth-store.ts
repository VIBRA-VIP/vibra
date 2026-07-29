import { create } from 'zustand';
import type { AuthUser } from '@/features/auth';
import { purgeLegacySharedChatStorage } from '@/features/chat/local-chat-storage';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  hydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken?: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('vibra_access_token'),
  hydrated: false,
  setAuth: (user, accessToken, refreshToken) => {
    purgeLegacySharedChatStorage();
    localStorage.setItem('vibra_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('vibra_refresh_token', refreshToken);
    }
    set({ user, accessToken });
  },
  setUser: (user) => set({ user }),
  clearAuth: () => {
    purgeLegacySharedChatStorage();
    localStorage.removeItem('vibra_access_token');
    localStorage.removeItem('vibra_refresh_token');
    set({ user: null, accessToken: null });
  },
  setHydrated: (hydrated) => set({ hydrated }),
}));
