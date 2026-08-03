import { CREDIT_VALUE_COP, formatCop, formatCreditsCopHint } from '@vibra/shared';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

type Props = {
  videoPricePerMin: number;
  onVideoPricePerMin: (v: number) => void;
};

export function ModelPricingFields({ videoPricePerMin, onVideoPricePerMin }: Props) {
  const credits = Number.isFinite(videoPricePerMin) ? Math.max(0, videoPricePerMin) : 0;

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
            <p className="mt-0.5 text-xs text-zinc-400">Por minuto</p>
          </div>
          <input
            type="number"
            min={0}
            aria-label="Precio Videollamada"
            className={inputClass}
            value={credits}
            onChange={(e) => onVideoPricePerMin(Number(e.target.value))}
          />
          <p className="text-sm font-medium text-vibra-gold">
            {credits} créd/min · {formatCreditsCopHint(credits)}
          </p>
        </div>
      </div>
    </section>
  );
}
