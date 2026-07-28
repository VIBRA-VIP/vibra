import { useEffect, type ReactNode } from 'react';
import { meRequest } from '@/features/auth';
import { useAuthStore } from '@/store';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!accessToken) {
        if (!cancelled) setHydrated(true);
        return;
      }
      try {
        const user = await meRequest();
        if (!cancelled) setUser(user);
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [accessToken, clearAuth, setHydrated, setUser]);

  return children;
}
