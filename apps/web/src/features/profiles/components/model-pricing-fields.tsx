import {
  CREDIT_VALUE_COP,
  clampVideoPricePerMin,
  formatCop,
  formatCreditsCopHint,
  maxVideoPricePerMin,
} from '@vibra/shared';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

type Props = {
  videoPricePerMin: number;
  onVideoPricePerMin: (v: number) => void;
  followersCount?: number;
};

export function ModelPricingFields({
  videoPricePerMin,
  onVideoPricePerMin,
  followersCount = 0,
}: Props) {
  const max = maxVideoPricePerMin(followersCount);
  const credits = clampVideoPricePerMin(videoPricePerMin, followersCount);

  function setPrice(raw: number) {
    if (!Number.isFinite(raw)) {
      onVideoPricePerMin(1);
      return;
    }
    onVideoPricePerMin(Math.min(max, Math.max(1, Math.round(raw))));
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-display text-base font-semibold">Tus precios</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Cobras en créditos · 1 crédito ≈{' '}
          <span className="text-vibra-gold">{formatCop(CREDIT_VALUE_COP)}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-vibra-border bg-vibra-muted/40 p-4">
        <div className="space-y-3">
          <div>
            <p className="font-medium text-white">Videollamada</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Por minuto · máximo {max} créd
              {followersCount >= 1000
                ? ` (${followersCount.toLocaleString('es-CO')} seguidores)`
                : ' (hasta 1.000 seguidores)'}
            </p>
          </div>
          <input
            type="number"
            min={1}
            max={max}
            aria-label="Precio Videollamada"
            className={inputClass}
            value={credits}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <p className="text-sm font-medium text-vibra-gold">
            {credits} créd/min · {formatCreditsCopHint(credits)}
          </p>
          <p className="text-[11px] text-zinc-500">
            El tope sube +5 créd/min por cada 1.000 seguidores.
          </p>
        </div>
      </div>
    </section>
  );
}
