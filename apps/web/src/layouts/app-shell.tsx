import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Compass,
  MessageCircle,
  Coins,
  LogOut,
  Settings,
  Inbox,
} from 'lucide-react';
import { AppVersion, Logo } from '@/components';
import { logoutRequest } from '@/features/auth';
import { mediaSrc } from '@/features/media/services/media-api';
import { useAuthStore } from '@/store';
import { cn } from '@/utils';

type NavItem = {
  to: string;
  label: string;
  icon: typeof Compass;
  badge?: number;
};

export function AppShell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isModel = user?.role === 'MODEL';

  const nav: NavItem[] = isModel
    ? [
        { to: '/requests', label: 'Solicitudes', icon: Inbox, badge: 0 },
        { to: '/chats', label: 'Chats', icon: MessageCircle, badge: 0 },
        { to: '/settings', label: 'Ajustes', icon: Settings },
      ]
    : [
        { to: '/explore', label: 'Explorar', icon: Compass },
        { to: '/chats', label: 'Chats', icon: MessageCircle, badge: 0 },
        { to: '/settings', label: 'Ajustes', icon: Settings },
      ];

  const homeTo = isModel ? '/requests' : '/explore';

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
  const avatarUrl = user?.profile?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();
  const balance = user?.walletBalance ?? 0;

  return (
    <div className="flex h-dvh overflow-hidden bg-vibra-bg text-white">
      <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden border-r border-vibra-border bg-vibra-elevated md:flex">
        <div className="shrink-0 border-b border-vibra-border px-5 py-5">
          <Logo to={homeTo} />
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
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
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-vibra-pink px-1.5 text-[11px] font-semibold text-white">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="shrink-0 space-y-3 border-t border-vibra-border p-4">
          {!isModel ? (
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
          ) : (
            <div className="rounded-xl border border-vibra-border bg-vibra-muted p-3">
              <p className="text-xs text-zinc-400">Cola de videollamadas</p>
              <p className="mt-1 font-display text-lg font-semibold text-white">En espera</p>
              <p className="mt-1 text-xs text-zinc-500">Revisa Solicitudes para atender</p>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-lg px-1 py-2">
            {avatarUrl ? (
              <img
                src={mediaSrc(avatarUrl)}
                alt={displayName}
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-vibra-border"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="text-xs text-vibra-pink">
                {isModel ? 'Modelo' : 'Usuario'}
              </p>
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-vibra-border bg-vibra-elevated/95 backdrop-blur md:hidden">
          {nav.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-1 flex-col items-center gap-1 py-3 text-xs text-zinc-500',
                  isActive && 'text-vibra-pink',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {item.badge ? (
                <span className="absolute right-1/4 top-2 h-2 w-2 rounded-full bg-vibra-pink" />
              ) : null}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
