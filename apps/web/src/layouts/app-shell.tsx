import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Compass, MessageCircle, Users, Coins, LogOut, Settings } from 'lucide-react';
import { AppVersion, Logo } from '@/components';
import { logoutRequest } from '@/features/auth';
import { useAuthStore } from '@/store';
import { cn } from '@/utils';

const nav = [
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/explore', label: 'Personas', icon: Users },
  { to: '/chats', label: 'Chats', icon: MessageCircle, badge: 0 },
  { to: '/settings', label: 'Ajustes', icon: Settings },
];

export function AppShell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem('vibra_refresh_token') ?? undefined;
      await logoutRequest(refreshToken);
    } catch {
      // ignore
    }
    clearAuth();
    navigate('/login', { replace: true });
  }

  const displayName = user?.profile?.displayName ?? 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();
  const balance = user?.walletBalance ?? 0;

  return (
    <div className="flex min-h-screen bg-vibra-bg text-white">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-vibra-border bg-vibra-elevated md:flex">
        <div className="border-b border-vibra-border px-5 py-5">
          <Logo to="/explore" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white',
                  isActive && 'bg-white/5 text-white',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 border-t border-vibra-border p-4">
          <div className="rounded-xl border border-vibra-border bg-vibra-muted p-3">
            <p className="text-xs text-zinc-400">Mis créditos</p>
            <div className="mt-1 flex items-center gap-2">
              <Coins className="h-4 w-4 text-vibra-gold" />
              <span className="font-display text-lg font-semibold text-vibra-gold">
                {balance.toLocaleString('es-ES')}
              </span>
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-vibra-pink py-2 text-sm font-semibold transition hover:bg-vibra-pink-hover"
            >
              Comprar créditos
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-lg px-1 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="text-xs text-vibra-pink">{user?.role ?? 'CLIENT'}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <AppVersion />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-vibra-border bg-vibra-elevated/95 backdrop-blur md:hidden">
          {[
            { to: '/explore', label: 'Personas', icon: Users },
            { to: '/chats', label: 'Chats', icon: MessageCircle },
            { to: '/explore', label: 'Explorar', icon: Compass },
          ].map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-3 text-xs text-zinc-500',
                  isActive && 'text-vibra-pink',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
