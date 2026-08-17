import { useMutation } from '@tanstack/react-query';
import { PhoneOff, Video } from 'lucide-react';
import { mediaSrc } from '@/features/media/services/media-api';
import { endVideoCallRequest } from '../services/video-call-api';
import { useVideoCallStore } from '../store/video-call-store';

export function VideoCallWaiting() {
  const waitingCall = useVideoCallStore((s) => s.waitingCall);
  const clearSession = useVideoCallStore((s) => s.clearSession);

  const cancelMutation = useMutation({
    mutationFn: () => endVideoCallRequest(waitingCall!.id),
    onSettled: () => clearSession(),
  });

  if (!waitingCall || waitingCall.status !== 'PENDING') return null;

  const peer = waitingCall.model;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-vibra-border bg-vibra-elevated p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-vibra-pink/20 text-vibra-pink">
          <Video className="h-8 w-8 animate-pulse" />
        </div>
        {peer.avatarUrl ? (
          <img
            src={mediaSrc(peer.avatarUrl)}
            alt=""
            className="mx-auto mb-3 h-20 w-20 rounded-full object-cover"
          />
        ) : null}
        <h2 className="font-display text-xl font-bold">Esperando a {peer.displayName}</h2>
        <p className="mt-2 text-sm text-zinc-400">
          La modelo debe aceptar la videollamada. Se cobrarán {waitingCall.totalCredits} créditos al
          iniciar.
        </p>
        <button
          type="button"
          disabled={cancelMutation.isPending}
          onClick={() => cancelMutation.mutate()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-vibra-border px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
        >
          <PhoneOff className="h-4 w-4" />
          Cancelar
        </button>
      </div>
    </div>
  );
}
