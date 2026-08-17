import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Video, X } from 'lucide-react';
import { MIN_VIDEO_CALL_MINUTES, videoCallPrepaidCredits } from '@vibra/shared';
import { mediaSrc } from '@/features/media/services/media-api';
import { useAuthStore } from '@/store';
import { createVideoCallRequest } from '../services/video-call-api';
import { useVideoCallStore } from '../store/video-call-store';

function formatApiError(error: unknown): string | null {
  const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string') return msg;
  if (error instanceof Error) return error.message;
  return null;
}

export function VideoCallConfirmModal() {
  const user = useAuthStore((s) => s.user);
  const confirmTarget = useVideoCallStore((s) => s.confirmTarget);
  const closeConfirm = useVideoCallStore((s) => s.closeConfirm);
  const setWaitingCall = useVideoCallStore((s) => s.setWaitingCall);

  const balance = user?.walletBalance ?? 0;
  const pricePerMin = confirmTarget?.videoPricePerMin ?? 0;
  const totalCredits = videoCallPrepaidCredits(pricePerMin);
  const canAfford = balance >= totalCredits;

  const createMutation = useMutation({
    mutationFn: () => createVideoCallRequest(confirmTarget!.userId),
    onSuccess: (call) => {
      setWaitingCall(call);
    },
  });

  if (!confirmTarget) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={closeConfirm}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-vibra-border bg-vibra-elevated sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar videollamada"
      >
        <button
          type="button"
          onClick={closeConfirm}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-5 p-5 pt-6">
          <div className="flex items-center gap-3">
            {confirmTarget.avatarUrl ? (
              <img
                src={mediaSrc(confirmTarget.avatarUrl)}
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 text-lg font-semibold">
                {confirmTarget.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold">{confirmTarget.displayName}</p>
              <p className="text-sm text-zinc-400">@{confirmTarget.username}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-vibra-pink/30 bg-vibra-pink/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-vibra-pink">
              <Video className="h-5 w-5" />
              <p className="font-display text-sm font-semibold uppercase tracking-wide">
                Videollamada
              </p>
            </div>
            <p className="text-sm text-zinc-200">
              Mínimo {MIN_VIDEO_CALL_MINUTES} minutos. Se descontarán los créditos al aceptar la
              modelo.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-400">Precio por minuto</dt>
                <dd className="font-semibold text-vibra-gold">{pricePerMin} créd</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-400">Total ({MIN_VIDEO_CALL_MINUTES} min)</dt>
                <dd className="font-display text-lg font-bold text-white">{totalCredits} créd</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-white/10 pt-2">
                <dt className="text-zinc-400">Tu saldo</dt>
                <dd className={canAfford ? 'font-semibold text-vibra-online' : 'font-semibold text-red-400'}>
                  {balance} créd
                </dd>
              </div>
            </dl>
          </div>

          {createMutation.isError ? (
            <p className="text-sm text-red-400">
              {formatApiError(createMutation.error) ?? 'No se pudo solicitar la videollamada'}
            </p>
          ) : null}

          {!canAfford ? (
            <p className="text-sm text-amber-300">
              No tienes créditos suficientes.{' '}
              <Link to="/credits" onClick={closeConfirm} className="underline">
                Comprar créditos
              </Link>
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeConfirm}
              className="flex-1 rounded-xl border border-vibra-border py-3 text-sm font-semibold text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canAfford || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="flex-1 rounded-xl bg-vibra-pink py-3 text-sm font-semibold text-white transition hover:bg-vibra-pink-hover disabled:opacity-50"
            >
              {createMutation.isPending ? 'Solicitando…' : 'Llamar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
