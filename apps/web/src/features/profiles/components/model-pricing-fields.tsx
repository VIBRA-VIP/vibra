import { CREDIT_VALUE_COP, formatCop, formatCreditsCopHint } from '@vibra/shared';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

type Props = {
  videoPricePerMin: number;
  contentPrice: number;
  acceptsEncounters: boolean;
  onVideoPricePerMin: (v: number) => void;
  onContentPrice: (v: number) => void;
  onAcceptsEncounters: (v: boolean) => void;
};

function PriceRow({
  title,
  hint,
  value,
  unit,
  onChange,
}: {
  title: string;
  hint: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-vibra-border bg-vibra-muted/40 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">{title}</p>
          <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>
        </div>
        <div className="w-full sm:w-36">
          <input
            type="number"
            min={0}
            aria-label={`Precio ${title}`}
            className={inputClass}
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <p className="mt-1.5 text-right text-xs font-medium text-vibra-gold">
            {value} {unit}
          </p>
          <p className="text-right text-[11px] text-zinc-500">{formatCreditsCopHint(value)}</p>
        </div>
      </div>
    </div>
  );
}

export function ModelPricingFields({
  videoPricePerMin,
  contentPrice,
  acceptsEncounters,
  onVideoPricePerMin,
  onContentPrice,
  onAcceptsEncounters,
}: Props) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-display text-base font-semibold">Tus precios</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Cobras en créditos · 1 crédito ≈{' '}
          <span className="text-vibra-gold">{formatCop(CREDIT_VALUE_COP)}</span>
        </p>
      </div>

      <PriceRow
        title="Videollamada"
        hint="Por minuto"
        value={videoPricePerMin}
        unit="créd/min"
        onChange={onVideoPricePerMin}
      />
      <PriceRow
        title="Contenido exclusivo"
        hint="Por foto, video o pack"
        value={contentPrice}
        unit="créditos"
        onChange={onContentPrice}
      />

      <label className="flex items-start gap-3 rounded-2xl border border-vibra-border bg-vibra-muted/40 p-4 text-sm text-zinc-300">
        <input
          type="checkbox"
          className="mt-1"
          checked={acceptsEncounters}
          onChange={(e) => onAcceptsEncounters(e.target.checked)}
        />
        <span>
          <span className="font-medium text-white">Acepto encuentros / citas</span>
          <span className="mt-1 block text-xs text-zinc-400">
            Los usuarios verán que ofreces citas fuera de la app.
          </span>
        </span>
      </label>
    </section>
  );
}
