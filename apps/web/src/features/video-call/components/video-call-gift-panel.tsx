import { useMutation, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useAuthStore } from '@/store';
import { listGiftsRequest, sendGiftRequest } from '../services/video-call-api';

type Props = {
  callId: string;
  onClose: () => void;
  onSent?: () => void;
};

export function VideoCallGiftPanel({ callId, onClose, onSent }: Props) {
  const balance = useAuthStore((s) => s.user?.walletBalance ?? 0);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const giftsQuery = useQuery({
    queryKey: ['video-call', 'gifts'],
    queryFn: listGiftsRequest,
  });

  const sendMutation = useMutation({
    mutationFn: (giftId: string) => sendGiftRequest(callId, giftId),
    onSuccess: (event) => {
      if (user) {
        setUser({ ...user, walletBalance: event.clientBalance });
      }
      onSent?.();
      onClose();
    },
  });

  return (
    <div className="absolute inset-x-0 bottom-0 z-[90] rounded-t-3xl border border-white/10 bg-zinc-950/95 p-4 backdrop-blur-md sm:inset-x-auto sm:bottom-24 sm:left-4 sm:w-80 sm:rounded-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-semibold text-white">Enviar regalo</p>
          <p className="text-xs text-zinc-400">Tu saldo: {balance} créd</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
          aria-label="Cerrar regalos"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {giftsQuery.isLoading ? (
        <p className="text-center text-xs text-zinc-500">Cargando…</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {(giftsQuery.data ?? []).map((gift) => {
            const canAfford = balance >= gift.credits;
            return (
              <button
                key={gift.id}
                type="button"
                disabled={!canAfford || sendMutation.isPending}
                onClick={() => sendMutation.mutate(gift.id)}
                className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 transition hover:border-vibra-pink/50 hover:bg-vibra-pink/10 disabled:opacity-40"
              >
                <span className="text-2xl" aria-hidden>
                  {gift.emoji}
                </span>
                <span className="text-[11px] font-medium text-zinc-200">{gift.label}</span>
                <span className="text-[10px] text-vibra-gold">{gift.credits} créd</span>
              </button>
            );
          })}
        </div>
      )}

      {sendMutation.isError ? (
        <p className="mt-3 text-xs text-red-400">
          {(sendMutation.error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? 'No se pudo enviar el regalo'}
        </p>
      ) : null}
    </div>
  );
}
