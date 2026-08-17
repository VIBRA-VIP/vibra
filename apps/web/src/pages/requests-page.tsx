import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, PhoneOff, Search, Users, Video } from 'lucide-react';
import { meRequest } from '@/features/auth';
import { mediaSrc } from '@/features/media/services/media-api';
import { fetchClients, type ClientProfile } from '@/features/profiles';
import {
  acceptVideoCallRequest,
  declineVideoCallRequest,
  listPendingVideoCallsRequest,
  useVideoCallStore,
  type VideoCallDto,
} from '@/features/video-call';
import { useAuthStore } from '@/store';
import { cn } from '@/utils';

function formatWait(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

type Tab = 'queue' | 'users';

export function RequestsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setActiveCall = useVideoCallStore((s) => s.setActiveCall);
  const balance = user?.walletBalance ?? 0;
  const [tab, setTab] = useState<Tab>('queue');
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('');
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const pendingQuery = useQuery({
    queryKey: ['video-call', 'pending'],
    queryFn: listPendingVideoCallsRequest,
    enabled: user?.role === 'MODEL',
    refetchInterval: 4000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clients', query, gender, onlyOnline],
    queryFn: () =>
      fetchClients({
        q: query || undefined,
        gender: gender || undefined,
        filter: onlyOnline ? 'online' : undefined,
      }),
    enabled: user?.role === 'MODEL',
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const queue = useMemo(() => {
    const items = pendingQuery.data ?? [];
    return [...items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [pendingQuery.data]);

  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptVideoCallRequest(id),
    onSuccess: async (call: VideoCallDto) => {
      setActiveCall(call);
      void queryClient.invalidateQueries({ queryKey: ['video-call', 'pending'] });
      try {
        const me = await meRequest();
        setUser(me);
      } catch {
        /* ignore */
      }
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => declineVideoCallRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['video-call', 'pending'] });
    },
  });

  const clients = data?.clients ?? [];
  const totalClients = data?.totalClients ?? 0;
  const onlineClients = data?.onlineClients ?? 0;

  if (user?.role !== 'MODEL') {
    return <Navigate to="/explore" replace />;
  }

  function writeTo(client: ClientProfile) {
    navigate('/chats', {
      state: {
        peer: {
          userId: client.userId,
          displayName: client.displayName,
          username: client.username,
          avatarUrl: client.avatarUrl,
        },
      },
    });
  }

  function waitedSeconds(call: VideoCallDto) {
    return Math.max(0, Math.floor((now - new Date(call.createdAt).getTime()) / 1000));
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 text-left">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 text-left">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Solicitudes</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Atiende videollamadas y escribe a usuarios cuando quieras.
          </p>
        </div>
        <Link
          to="/earnings"
          className="rounded-2xl border border-vibra-gold/30 bg-vibra-gold/10 px-4 py-2 text-right transition hover:border-vibra-gold/50 hover:bg-vibra-gold/15"
        >
          <p className="text-[11px] uppercase tracking-wide text-zinc-400">Ganancias</p>
          <p className="font-display text-xl font-bold text-vibra-gold">
            {balance.toLocaleString('es-ES')}{' '}
            <span className="text-xs font-medium text-zinc-400">créd</span>
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">Solicitar retiro</p>
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-vibra-border bg-vibra-elevated p-3 text-center">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Usuarios</p>
          <p className="mt-1 font-display text-2xl font-bold">{totalClients}</p>
        </div>
        <div className="rounded-2xl border border-vibra-border bg-vibra-elevated p-3 text-center">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">En línea</p>
          <p className="mt-1 font-display text-2xl font-bold text-vibra-online">
            {onlineClients}
          </p>
        </div>
        <div className="rounded-2xl border border-vibra-border bg-vibra-elevated p-3 text-center">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">En cola</p>
          <p className="mt-1 font-display text-2xl font-bold text-vibra-pink">{queue.length}</p>
        </div>
      </div>

      <div className="mb-5 flex gap-2 rounded-xl border border-vibra-border bg-vibra-muted p-1">
        <button
          type="button"
          onClick={() => setTab('queue')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition',
            tab === 'queue' ? 'bg-vibra-pink text-white' : 'text-zinc-400 hover:text-white',
          )}
        >
          <Video className="h-4 w-4" />
          Cola
          {queue.length > 0 ? (
            <span className="rounded-full bg-black/20 px-1.5 text-[11px]">{queue.length}</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setTab('users')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition',
            tab === 'users' ? 'bg-vibra-pink text-white' : 'text-zinc-400 hover:text-white',
          )}
        >
          <Users className="h-4 w-4" />
          Usuarios
          <span className="rounded-full bg-black/20 px-1.5 text-[11px]">{totalClients}</span>
        </button>
      </div>

      {tab === 'queue' ? (
        pendingQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Cargando cola…</p>
        ) : queue.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-vibra-border bg-vibra-elevated/60 px-6 py-14 text-center">
            <div
              className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-vibra-pink/30 via-zinc-800 to-zinc-950 text-5xl shadow-inner"
              aria-hidden
            >
              📞
            </div>
            <p className="font-display text-xl font-semibold">Nadie en la cola</p>
            <p className="mt-2 max-w-sm text-sm text-zinc-400">
              Cuando alguien solicite una videollamada, aparecerá aquí. Mientras, puedes escribir
              a usuarios en la otra pestaña.
            </p>
            <button
              type="button"
              onClick={() => setTab('users')}
              className="mt-6 rounded-xl bg-vibra-pink px-5 py-2.5 text-sm font-semibold"
            >
              Ver usuarios
            </button>
          </div>
        ) : (
          <>
            {acceptMutation.isError ? (
              <p className="mb-3 text-sm text-red-400">
                {(acceptMutation.error as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message ?? 'No se pudo aceptar la llamada'}
              </p>
            ) : null}
          <ul className="space-y-3">
            {queue.map((req, index) => (
              <li
                key={req.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-vibra-border bg-vibra-elevated p-4',
                  index === 0 && 'ring-1 ring-vibra-pink/40',
                )}
              >
                <div className="relative shrink-0">
                  {req.client.avatarUrl ? (
                    <img
                      src={mediaSrc(req.client.avatarUrl)}
                      alt={req.client.displayName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-lg font-semibold">
                      {req.client.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-vibra-pink text-white shadow">
                    <Video className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{req.client.displayName}</p>
                    {index === 0 ? (
                      <span className="rounded-full bg-vibra-pink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                        Siguiente
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                        #{index + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400">
                    Videollamada · {req.pricePerMin} créd/min · ganas{' '}
                    <span className="font-semibold text-vibra-gold">{req.totalCredits} créd</span> ·
                    espera {formatWait(waitedSeconds(req))}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={declineMutation.isPending || acceptMutation.isPending}
                    onClick={() => declineMutation.mutate(req.id)}
                    className="rounded-xl border border-vibra-border p-2.5 text-zinc-400 transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                    aria-label="Rechazar"
                  >
                    <PhoneOff className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                    onClick={() => acceptMutation.mutate(req.id)}
                    className="rounded-xl bg-vibra-pink px-3 py-2 text-sm font-semibold transition hover:bg-vibra-pink-hover disabled:opacity-50"
                  >
                    Aceptar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          </>
        )
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full rounded-xl border border-vibra-border bg-vibra-elevated py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-zinc-500 focus:border-vibra-pink/50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: '', label: 'Todos' },
              { id: 'FEMALE', label: 'Mujeres' },
              { id: 'MALE', label: 'Hombres' },
            ].map((g) => (
              <button
                key={g.id || 'all'}
                type="button"
                onClick={() => setGender(g.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition',
                  gender === g.id
                    ? 'bg-white text-black'
                    : 'border border-vibra-border text-zinc-400 hover:text-white',
                )}
              >
                {g.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOnlyOnline((v) => !v)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                onlyOnline
                  ? 'bg-vibra-online/20 text-vibra-online'
                  : 'border border-vibra-border text-zinc-400 hover:text-white',
              )}
            >
              Solo en línea
            </button>
          </div>

          {isLoading ? <p className="text-sm text-zinc-400">Cargando usuarios...</p> : null}
          {isError ? (
            <p className="text-sm text-red-400">
              No se pudieron cargar los usuarios. Cierra sesión y vuelve a entrar (token
              expirado o sin autorización).
            </p>
          ) : null}

          {!isLoading && !isError && clients.length === 0 ? (
            <div className="flex min-h-[36vh] flex-col items-center justify-center rounded-3xl border border-dashed border-vibra-border bg-vibra-elevated/60 px-6 py-12 text-center">
              <div className="mb-3 text-5xl" aria-hidden>
                {gender === 'MALE' ? '👨' : gender === 'FEMALE' ? '👩' : '👥'}
              </div>
              <p className="font-display text-lg font-semibold">
                {gender === 'MALE'
                  ? 'No hay usuarios hombres'
                  : gender === 'FEMALE'
                    ? 'No hay usuarias mujeres'
                    : onlyOnline
                      ? 'Nadie en línea ahora'
                      : 'No hay usuarios aún'}
              </p>
              <p className="mt-1 max-w-xs text-sm text-zinc-400">
                {gender
                  ? 'Prueba el filtro “Todos” o espera a que se registren más personas.'
                  : 'Cuando se registren usuarios, podrás escribirles desde aquí.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {clients.map((client) => (
                <li
                  key={client.id}
                  className="flex items-center gap-3 rounded-2xl border border-vibra-border bg-vibra-elevated px-4 py-3"
                >
                  <div className="relative shrink-0">
                    {client.avatarUrl ? (
                      <img
                        src={mediaSrc(client.avatarUrl)}
                        alt={client.displayName}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold">
                        {client.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {client.isOnline ? (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-vibra-elevated bg-vibra-online" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{client.displayName}</p>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          client.gender === 'MALE'
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-rose-500/20 text-rose-300',
                        )}
                      >
                        {client.gender === 'MALE' ? 'Hombre' : 'Mujer'}
                      </span>
                    </div>
                    <p className="truncate text-xs text-zinc-400">
                      @{client.username}
                      {client.age ? ` · ${client.age}` : ''}
                      {client.isOnline ? ' · En línea' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => writeTo(client)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-vibra-pink px-3 py-2 text-xs font-semibold transition hover:bg-vibra-pink-hover"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Escribir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
