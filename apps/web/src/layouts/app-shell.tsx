import { useEffect, useMemo, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  MessageCircle,
  Coins,
  LogOut,
  Settings,
  Inbox,
  PlusSquare,
  UserRound,
  Users,
} from 'lucide-react';
import { AppVersion, Logo } from '@/components';
import { logoutRequest } from '@/features/auth';
import { listConversationsRequest } from '@/features/chat/chat-api';
import {
  playChatPing,
  setUnreadDocumentTitle,
  unlockChatAudio,
} from '@/features/chat/chat-notify';
import { connectChatSocket, disconnectChatSocket } from '@/features/chat/chat-socket';
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
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isModel = user?.role === 'MODEL';
  const myId = user?.id;

  const conversationsQuery = useQuery({
    queryKey: ['chat', 'conversations', myId],
    queryFn: listConversationsRequest,
    enabled: Boolean(myId),
    refetchInterval: 4000,
  });

  const unreadTotal = useMemo(
    () =>
      (conversationsQuery.data ?? []).reduce(
        (sum, c) => sum + Math.max(0, c.unreadCount ?? 0),
        0,
      ),
    [conversationsQuery.data],
  );
  const prevUnreadRef = useRef<number | null>(null);

  useEffect(() => {
    const unlock = () => unlockChatAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    const sock = connectChatSocket(accessToken);
    if (!sock || !myId) return;

    const onMessage = (payload: {
      conversationId?: string;
      senderId?: string;
    }) => {
      void queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', myId] });
      if (payload.conversationId) {
        void queryClient.invalidateQueries({
          queryKey: ['chat', 'messages', payload.conversationId],
        });
      }
      if (payload.senderId && payload.senderId !== myId) {
        playChatPing();
      }
    };

    sock.on('chat:message', onMessage);
    return () => {
      sock.off('chat:message', onMessage);
    };
  }, [accessToken, myId, queryClient]);

  useEffect(() => {
    return () => {
      disconnectChatSocket();
    };
  }, []);

  useEffect(() => {
    setUnreadDocumentTitle(unreadTotal);
    if (prevUnreadRef.current === null) {
      prevUnreadRef.current = unreadTotal;
      return;
    }
    if (unreadTotal > prevUnreadRef.current) {
      playChatPing();
    }
    prevUnreadRef.current = unreadTotal;
  }, [unreadTotal]);

  useEffect(() => {
    const onFocus = () => {
      void queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', myId] });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [myId, queryClient]);

  const chatBadge = unreadTotal > 0 ? unreadTotal : undefined;

  const nav: NavItem[] = isModel
    ? [
        { to: '/requests', label: 'Solicitudes', icon: Inbox },
        { to: '/publish', label: 'Publicar', icon: PlusSquare },
        { to: '/chats', label: 'Chats', icon: MessageCircle, badge: chatBadge },
        { to: '/settings', label: 'Ajustes', icon: Settings },
        { to: '/me', label: 'Mi perfil', icon: UserRound },
      ]
    : [
        { to: '/explore', label: 'Explorar', icon: Compass },
        { to: '/conocer', label: 'Conocer', icon: Users },
        { to: '/chats', label: 'Chats', icon: MessageCircle, badge: chatBadge },
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
    setUnreadDocumentTitle(0);
    disconnectChatSocket();
    clearAuth();
    navigate('/login', { replace: true });
  }

  const displayName = user?.profile?.displayName ?? 'Usuario';
  const avatarUrl = user?.profile?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();
  const balance = user?.walletBalance ?? 0;
  const onChats = location.pathname.startsWith('/chats');

  return (
    <div className="flex h-dvh overflow-hidden bg-vibra-bg text-white">
      <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden border-r border-vibra-border bg-vibra-elevated md:flex">
        <div className="shrink-0 border-b border-vibra-border px-5 py-5">
          <Logo to={homeTo} />
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const profilePath = user?.profile?.username
              ? `/profile/${user.profile.username}`
              : null;
            return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => {
                const active =
                  item.to === '/me'
                    ? isActive ||
                      (profilePath != null && location.pathname === profilePath)
                    : isActive;
                return cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white',
                  active && 'bg-white/5 text-white',
                );
              }}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-vibra-pink px-1.5 text-[11px] font-semibold text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
            </NavLink>
            );
          })}
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
            <button
              type="button"
              className={cn(
                'flex min-w-0 flex-1 items-center gap-3 text-left',
                isModel && 'rounded-lg hover:bg-white/5',
              )}
              onClick={() => {
                if (isModel) navigate('/me');
              }}
            >
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
                <p className="text-xs text-vibra-pink">{isModel ? 'Modelo' : 'Usuario'}</p>
              </div>
            </button>
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
          {nav.map((item) => {
            const profilePath = user?.profile?.username
              ? `/profile/${user.profile.username}`
              : null;
            return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => {
                const active =
                  item.to === '/me'
                    ? isActive ||
                      (profilePath != null && location.pathname === profilePath)
                    : isActive;
                return cn(
                  'relative flex flex-1 flex-col items-center gap-1 py-3 text-xs text-zinc-500',
                  active && 'text-vibra-pink',
                );
              }}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge ? (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vibra-pink px-1 text-[10px] font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </NavLink>
            );
          })}
        </nav>
        {!onChats && unreadTotal > 0 ? (
          <span className="sr-only" aria-live="polite">
            Tienes {unreadTotal} mensaje{unreadTotal === 1 ? '' : 's'} sin leer
          </span>
        ) : null}
      </div>
    </div>
  );
}
