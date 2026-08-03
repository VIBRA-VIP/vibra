import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Logo, PasswordField } from '@/components';
import {
  adminUnlockRequest,
  approveModelRequest,
  clearAdminToken,
  fetchAdminDashboardRequest,
  getAdminToken,
  listPendingModelsRequest,
  rejectModelRequest,
  setAdminToken,
  type AdminDashboardDto,
  type PendingModelDto,
} from '@/features/admin/admin-api';
import { mediaSrc } from '@/features/media/services/media-api';
import { cn } from '@/utils';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('es-CO', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  });
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-vibra-border bg-vibra-elevated p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function UsageBar({ ratio, tone = 'pink' }: { ratio: number; tone?: 'pink' | 'gold' | 'sky' }) {
  const pct = Math.min(100, Math.max(0, Math.round(ratio * 100)));
  const bar =
    tone === 'gold'
      ? 'bg-vibra-gold'
      : tone === 'sky'
        ? 'bg-sky-400'
        : 'bg-vibra-pink';
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
      <div className={cn('h-full rounded-full transition-all', bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DashboardPanel({ data }: { data: AdminDashboardDto }) {
  const { users, system, disk, s3 } = data;
  const maxMonth = Math.max(1, ...users.monthly.map((m) => m.total));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">Dashboard</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Actualizado {new Date(data.generatedAt).toLocaleString('es-CO')}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuarios totales" value={users.totalUsers} />
        <StatCard label="Clientes" value={users.totalClients} />
        <StatCard label="Modelos" value={users.totalModels} />
        <StatCard
          label="Nuevos este mes"
          value={users.newThisMonth}
          hint={`${users.newLast30Days} en los últimos 30 días`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Modelos aprobadas" value={users.modelsApproved} />
        <StatCard label="Pendientes" value={users.modelsPending} />
        <StatCard label="Rechazadas" value={users.modelsRejected} />
      </div>

      <div className="rounded-2xl border border-vibra-border bg-vibra-elevated p-5">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Usuarios nuevos por mes
        </h3>
        <div className="mt-4 flex h-40 items-end gap-1.5 sm:gap-2">
          {users.monthly.map((m) => {
            const h = Math.max(4, Math.round((m.total / maxMonth) * 100));
            return (
              <div key={m.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-zinc-500">{m.total || ''}</span>
                <div
                  className="w-full rounded-t-md bg-vibra-pink/80"
                  style={{ height: `${h}%` }}
                  title={`${m.month}: ${m.total} (${m.clients} clientes, ${m.models} modelos)`}
                />
                <span className="truncate text-[10px] text-zinc-500">{monthLabel(m.month)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-vibra-border bg-vibra-elevated p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">CPU</p>
          <p className="mt-1 font-display text-xl font-bold">
            {(system.cpuUsageRatio * 100).toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Load {system.loadAvg1} / {system.loadAvg5} / {system.loadAvg15} · {system.cpuCount}{' '}
            cores
          </p>
          <UsageBar ratio={system.cpuUsageRatio} />
          <p className="mt-2 truncate text-[11px] text-zinc-600">{system.cpuModel}</p>
        </div>

        <div className="rounded-2xl border border-vibra-border bg-vibra-elevated p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Memoria RAM</p>
          <p className="mt-1 font-display text-xl font-bold">
            {(system.memory.usedRatio * 100).toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatBytes(system.memory.usedBytes)} / {formatBytes(system.memory.totalBytes)}
          </p>
          <UsageBar ratio={system.memory.usedRatio} tone="sky" />
          <p className="mt-2 text-[11px] text-zinc-600">
            Uptime {formatUptime(system.uptimeSec)} · {system.hostname}
          </p>
        </div>

        <div className="rounded-2xl border border-vibra-border bg-vibra-elevated p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Disco</p>
          <p className="mt-1 font-display text-xl font-bold">
            {(disk.usedRatio * 100).toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatBytes(disk.usedBytes)} / {formatBytes(disk.totalBytes)}
            {disk.path ? ` · ${disk.path}` : ''}
          </p>
          <UsageBar ratio={disk.usedRatio} tone="gold" />
          {disk.error ? <p className="mt-2 text-[11px] text-red-400">{disk.error}</p> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-vibra-border bg-vibra-elevated p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">S3</p>
        {!s3.configured ? (
          <p className="mt-2 text-sm text-zinc-400">{s3.error ?? 'S3 no configurado'}</p>
        ) : (
          <>
            <p className="mt-1 font-display text-xl font-bold">{formatBytes(s3.totalBytes)}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {s3.objectCount.toLocaleString('es-CO')} objetos · bucket{' '}
              <span className="text-zinc-300">{s3.bucket}</span> ({s3.region})
              {s3.truncated ? ' · listado truncado' : ''}
            </p>
            {s3.error ? <p className="mt-2 text-[11px] text-red-400">{s3.error}</p> : null}
          </>
        )}
      </div>
    </section>
  );
}

export function AdminPage() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchAdminDashboardRequest,
    enabled: Boolean(token),
    retry: false,
    refetchInterval: 30_000,
  });

  const pendingQuery = useQuery({
    queryKey: ['admin', 'pending-models'],
    queryFn: listPendingModelsRequest,
    enabled: Boolean(token),
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: approveModelRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pending-models'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectModelRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pending-models'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  async function onUnlock(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setUnlocking(true);
    try {
      const res = await adminUnlockRequest(key);
      setAdminToken(res.accessToken);
      setToken(res.accessToken);
      setKey('');
    } catch {
      setError('Clave incorrecta');
    } finally {
      setUnlocking(false);
    }
  }

  function logoutAdmin() {
    clearAdminToken();
    setToken(null);
    void queryClient.removeQueries({ queryKey: ['admin'] });
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vibra-bg px-4">
        <div className="w-full max-w-md rounded-2xl border border-vibra-border bg-vibra-elevated p-8">
          <Logo className="mb-8 justify-center" />
          <h1 className="font-display text-center text-2xl font-bold">Administración</h1>
          <form className="mt-8 space-y-4" onSubmit={onUnlock}>
            <PasswordField
              required
              minLength={8}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Clave de administrador"
              autoComplete="current-password"
              inputClassName={inputClass}
            />
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={unlocking}
              className="w-full rounded-xl bg-vibra-pink py-3 text-sm font-semibold disabled:opacity-60"
            >
              {unlocking ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pending = pendingQuery.data ?? [];
  const sessionError = pendingQuery.isError || dashboardQuery.isError;

  return (
    <div className="mx-auto min-h-screen max-w-5xl space-y-10 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Administración</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Métricas del servidor y verificación de modelos.
          </p>
        </div>
        <button
          type="button"
          onClick={logoutAdmin}
          className="rounded-xl border border-vibra-border px-4 py-2 text-sm text-zinc-300 hover:text-white"
        >
          Salir
        </button>
      </div>

      {sessionError ? (
        <p className="text-sm text-red-400">
          Sesión expirada o error.{' '}
          <button type="button" className="underline" onClick={logoutAdmin}>
            Volver a entrar
          </button>
        </p>
      ) : null}

      {dashboardQuery.isLoading ? (
        <p className="text-sm text-zinc-400">Cargando dashboard...</p>
      ) : null}
      {dashboardQuery.data ? <DashboardPanel data={dashboardQuery.data} /> : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold">Modelos pendientes</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Revisa documento (frente y reverso) y aprueba o rechaza.
          </p>
        </div>

        {pendingQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Cargando...</p>
        ) : null}

        {!pendingQuery.isLoading && !pendingQuery.isError && pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-vibra-border px-6 py-12 text-center text-sm text-zinc-400">
            No hay modelos pendientes de verificación.
          </p>
        ) : null}

        <div className="space-y-4">
          {pending.map((model) => (
            <PendingModelCard
              key={model.userId}
              model={model}
              busy={approveMutation.isPending || rejectMutation.isPending}
              onApprove={() => approveMutation.mutate(model.userId)}
              onReject={() => rejectMutation.mutate(model.userId)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function PendingModelCard({
  model,
  busy,
  onApprove,
  onReject,
}: {
  model: PendingModelDto;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article className="rounded-2xl border border-vibra-border bg-vibra-elevated p-5">
      <div className="flex flex-wrap items-start gap-4">
        {model.avatarUrl ? (
          <img
            src={mediaSrc(model.avatarUrl)}
            alt={model.displayName}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700 text-lg font-semibold">
            {model.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {model.displayName}{' '}
            <span className="text-sm font-normal text-zinc-400">@{model.username}</span>
          </p>
          <p className="mt-1 text-sm text-zinc-400">{model.email}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {model.age} años
            {model.birthDate ? ` · nac. ${model.birthDate}` : ''}
            {model.profileCompleted ? ' · perfil completo' : ' · perfil incompleto'}
            {model.verificationSubmittedAt
              ? ` · enviado ${new Date(model.verificationSubmittedAt).toLocaleString('es-CO')}`
              : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            Rechazar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="rounded-xl bg-vibra-pink px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Aprobar
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <DocThumb label="Frente" url={model.idDocumentUrl} />
        <DocThumb label="Reverso" url={model.idDocumentBackUrl} />
      </div>
    </article>
  );
}

function DocThumb({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      {url ? (
        <a href={mediaSrc(url)} target="_blank" rel="noreferrer">
          <img
            src={mediaSrc(url)}
            alt={label}
            className="aspect-[4/3] w-full rounded-xl border border-vibra-border bg-black/40 object-contain"
          />
        </a>
      ) : (
        <div className="grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-vibra-border text-xs text-zinc-500">
          Sin foto
        </div>
      )}
    </div>
  );
}
