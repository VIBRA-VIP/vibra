import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Logo } from '@/components';
import {
  adminUnlockRequest,
  approveModelRequest,
  clearAdminToken,
  getAdminToken,
  listPendingModelsRequest,
  rejectModelRequest,
  setAdminToken,
  type PendingModelDto,
} from '@/features/admin/admin-api';
import { mediaSrc } from '@/features/media/services/media-api';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

export function AdminPage() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

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
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectModelRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pending-models'] });
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
            <input
              type="password"
              required
              minLength={8}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Clave de administrador"
              className={inputClass}
              autoComplete="current-password"
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

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Modelos pendientes</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Revisa documento (frente y reverso) y aprueba o rechaza.
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

      {pendingQuery.isLoading ? (
        <p className="text-sm text-zinc-400">Cargando...</p>
      ) : null}
      {pendingQuery.isError ? (
        <p className="text-sm text-red-400">
          Sesión expirada o error.{' '}
          <button type="button" className="underline" onClick={logoutAdmin}>
            Volver a entrar
          </button>
        </p>
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
            busy={
              approveMutation.isPending ||
              rejectMutation.isPending
            }
            onApprove={() => approveMutation.mutate(model.userId)}
            onReject={() => rejectMutation.mutate(model.userId)}
          />
        ))}
      </div>
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
            className="aspect-[4/3] w-full rounded-xl border border-vibra-border object-contain bg-black/40"
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
