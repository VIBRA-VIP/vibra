import { Heart, MessageCircle, Video, X } from 'lucide-react';
import type { ModelProfile } from '../types/model-profile';

const femaleAttrOrder = [
  'height',
  'bodyType',
  'skinTone',
  'bust',
  'waist',
  'hips',
  'tattoos',
  'hair',
  'vibe',
];

const maleAttrOrder = [
  'height',
  'bodyType',
  'skinTone',
  'penisSize',
  'penisGirth',
  'tattoos',
  'hair',
  'vibe',
];

const attrLabels: Record<string, string> = {
  height: 'Altura',
  bodyType: 'Complexión',
  skinTone: 'Tono de piel',
  bust: 'Busto',
  waist: 'Cintura',
  hips: 'Cadera',
  tattoos: 'Tatuajes',
  hair: 'Cabello',
  vibe: 'Estilo',
  penisSize: 'Tamaño',
  penisGirth: 'Grosor',
};

interface Props {
  model: ModelProfile;
  onClose: () => void;
}

export function ModelProfileModal({ model, onClose }: Props) {
  const order = model.gender === 'MALE' ? maleAttrOrder : femaleAttrOrder;
  const attrs = order
    .filter((key) => model.attributes[key] != null && model.attributes[key] !== '')
    .map((key) => ({
      key,
      label: attrLabels[key] ?? key,
      value: String(model.attributes[key]),
    }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-vibra-border bg-vibra-elevated sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil de ${model.displayName}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative aspect-[4/5] max-h-[42vh] shrink-0 overflow-hidden bg-zinc-800">
          {model.avatarUrl ? (
            <img
              src={model.avatarUrl}
              alt={model.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${
                model.gender === 'MALE'
                  ? 'from-sky-900 via-zinc-800 to-zinc-950'
                  : 'from-rose-900 via-zinc-800 to-zinc-950'
              }`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-vibra-elevated via-transparent to-transparent" />
          {model.isOnline ? (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-[11px] font-medium backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-vibra-online" />
              En línea
            </span>
          ) : null}
        </div>

        <div className="space-y-5 overflow-y-auto px-5 pb-6 pt-2">
          <div>
            <h2 className="font-display text-2xl font-bold">
              {model.displayName}{' '}
              {model.isVerified ? <span className="text-vibra-pink">✓</span> : null}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {model.age} · ★ {model.rating.toFixed(1)} ({model.ratingCount}) · @
              {model.username}
            </p>
          </div>

          {model.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {model.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-vibra-border bg-vibra-muted px-3 py-1 text-xs text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {model.bio ? (
            <section>
              <h3 className="font-display text-sm font-semibold text-white">Acerca de</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{model.bio}</p>
            </section>
          ) : null}

          {attrs.length > 0 ? (
            <section>
              <h3 className="font-display text-sm font-semibold text-white">Detalles</h3>
              <dl className="mt-3 grid grid-cols-2 gap-2">
                {attrs.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-xl border border-vibra-border bg-vibra-muted/60 px-3 py-2"
                  >
                    <dt className="text-[11px] uppercase tracking-wide text-zinc-500">
                      {item.label}
                    </dt>
                    <dd className="mt-0.5 text-sm text-zinc-200">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {model.services.length > 0 ? (
            <section>
              <h3 className="font-display text-sm font-semibold text-white">Servicios</h3>
              <ul className="mt-3 space-y-2">
                {model.services.map((service) => (
                  <li
                    key={service.name}
                    className="flex items-center justify-between rounded-xl border border-vibra-border bg-vibra-muted/60 px-4 py-3 text-sm"
                  >
                    <span>{service.name}</span>
                    <span className="text-zinc-400">
                      {service.price} {service.unit ?? 'créditos'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-vibra-pink py-3 text-sm font-semibold"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </button>
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-vibra-pink py-3 text-sm font-semibold text-vibra-pink"
            >
              <Video className="h-4 w-4" />
              Video
            </button>
            <button
              type="button"
              className="rounded-xl border border-vibra-border p-3 text-zinc-300"
              aria-label="Seguir"
            >
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
