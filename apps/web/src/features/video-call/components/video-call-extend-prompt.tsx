import { Clock, Loader2, X } from 'lucide-react';
import { videoCallExtendCredits } from '@vibra/shared';

type Props = {
  peerName: string;
  pricePerMin: number;
  options: number[];
  balance: number;
  secondsLeft: number;
  pendingMinutes: number | null;
  error: string | null;
  onExtend: (minutes: number) => void;
  onDismiss: () => void;
};

export function VideoCallExtendPrompt({
  peerName,
  pricePerMin,
  options,
  balance,
  secondsLeft,
  pendingMinutes,
  error,
  onExtend,
  onDismiss,
}: Props) {
  const busy = pendingMinutes != null;
  const progress = Math.max(0, Math.min(1, secondsLeft / 60));

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-[92] flex justify-center px-4 sm:bottom-32">
      <div className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-3xl border border-vibra-gold/40 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur-xl">
        <span
          className="absolute inset-x-0 top-0 h-1 bg-vibra-gold transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
          aria-hidden
        />
        <span
          className="absolute -inset-px animate-pulse rounded-3xl ring-1 ring-vibra-gold/30"
          aria-hidden
        />

        <button
          type="button"
          onClick={onDismiss}
          disabled={busy}
          className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-500 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          aria-label="Ocultar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-vibra-gold">
          <Clock className="h-4 w-4" />
          <p className="text-xs font-bold uppercase tracking-wide">
            Quedan {secondsLeft}s
          </p>
        </div>

        <p className="mt-2 font-display text-lg font-bold leading-tight text-white">
          ¿Sigues con {peerName}?
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Agrega tiempo antes de que se corte. Tu saldo: {balance} créd.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {options.map((minutes) => {
            const credits = videoCallExtendCredits(pricePerMin, minutes);
            const affordable = balance >= credits;
            return (
              <button
                key={minutes}
                type="button"
                disabled={!affordable || busy}
                onClick={() => onExtend(minutes)}
                className="group relative flex flex-col items-center gap-0.5 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 transition hover:-translate-y-0.5 hover:border-vibra-gold/60 hover:bg-vibra-gold/10 disabled:translate-y-0 disabled:opacity-40"
              >
                {pendingMinutes === minutes ? (
                  <Loader2 className="h-6 w-6 animate-spin text-vibra-gold" />
                ) : (
                  <>
                    <span className="font-display text-xl font-bold text-white">
                      +{minutes}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">min</span>
                    <span className="text-[11px] font-semibold text-vibra-gold">
                      {credits} créd
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}

        <button
          type="button"
          onClick={onDismiss}
          disabled={busy}
          className="mt-3 w-full text-center text-xs text-zinc-500 transition hover:text-zinc-300 disabled:opacity-40"
        >
          No, dejar que termine
        </button>
      </div>
    </div>
  );
}
