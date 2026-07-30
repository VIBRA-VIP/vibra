import {
  CREDIT_VALUE_COP,
  formatCop,
  formatCreditsCopHint,
} from '@vibra/shared';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

type Props = {
  messagePrice: number;
  chatPricePerMin: number;
  videoPricePerMin: number;
  contentPrice: number;
  acceptsEncounters: boolean;
  onMessagePrice: (v: number) => void;
  onChatPricePerMin: (v: number) => void;
  onVideoPricePerMin: (v: number) => void;
  onContentPrice: (v: number) => void;
  onAcceptsEncounters: (v: boolean) => void;
};

function PriceRow({
  title,
  description,
  value,
  unit,
  onChange,
  example,
}: {
  title: string;
  description: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  example: string;
}) {
  return (
    <div className="rounded-2xl border border-vibra-border bg-vibra-muted/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{description}</p>
          <p className="mt-2 text-[11px] text-zinc-500">{example}</p>
        </div>
        <div className="w-full sm:w-36">
          <label className="block text-[11px] uppercase tracking-wide text-zinc-500">
            Precio
            <div className="relative mt-1">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={Number.isFinite(value) ? value : 0}
                onChange={(e) => onChange(Number(e.target.value))}
              />
            </div>
          </label>
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
  messagePrice,
  chatPricePerMin,
  videoPricePerMin,
  contentPrice,
  acceptsEncounters,
  onMessagePrice,
  onChatPricePerMin,
  onVideoPricePerMin,
  onContentPrice,
  onAcceptsEncounters,
}: Props) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-base font-semibold">Tus precios</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Define cuánto cobras. Los usuarios pagan con <span className="text-white">créditos</span>.
        </p>
      </div>

      <div className="rounded-2xl border border-vibra-pink/30 bg-vibra-pink/10 px-4 py-3">
        <p className="text-sm font-semibold text-white">¿Qué es 1 crédito?</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-300">
          1 crédito equivale a aproximadamente{' '}
          <span className="font-semibold text-vibra-gold">{formatCop(CREDIT_VALUE_COP)}</span>.
          Ejemplo: si cobras <span className="text-white">10 créditos</span>, el usuario paga cerca de{' '}
          <span className="text-vibra-gold">{formatCop(CREDIT_VALUE_COP * 10)}</span>.
        </p>
      </div>

      <div className="space-y-3">
        <PriceRow
          title="Mensaje"
          description="Lo que cobras por cada mensaje que te envían (texto o foto)."
          example="Ej: 6 créditos → el usuario gasta 6 créditos por mensaje."
          value={messagePrice}
          unit="créditos / mensaje"
          onChange={onMessagePrice}
        />
        <PriceRow
          title="Chat en vivo"
          description="Precio por cada minuto de chat escrito en tiempo real."
          example="Ej: 12 créditos/min → 5 minutos ≈ 60 créditos."
          value={chatPricePerMin}
          unit="créditos / min"
          onChange={onChatPricePerMin}
        />
        <PriceRow
          title="Videollamada"
          description="Precio por cada minuto de videollamada en vivo."
          example="Ej: 80 créditos/min → 10 minutos ≈ 800 créditos."
          value={videoPricePerMin}
          unit="créditos / min"
          onChange={onVideoPricePerMin}
        />
        <PriceRow
          title="Contenido exclusivo"
          description="Precio fijo por foto, video o pack privado que vendas."
          example="Ej: 100 créditos → un pack cuesta 100 créditos."
          value={contentPrice}
          unit="créditos / contenido"
          onChange={onContentPrice}
        />
      </div>

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
            Si lo activas, los usuarios sabrán que también ofreces citas fuera de la app. Puedes
            coordinar precio aparte.
          </span>
        </span>
      </label>
    </section>
  );
}
