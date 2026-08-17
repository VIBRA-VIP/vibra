import { useEffect, useState } from 'react';
import { Heart, MessageCircle, UserRound, Video, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatAttrValue } from '@vibra/shared';
import { VerifiedBadge } from '@/components/verified-badge';
import { BodyAttrIcon, attrKindFromKey } from '@/components/body-attr-icons';
import { mediaSrc } from '@/features/media/services/media-api';
import { useVideoCallStore } from '@/features/video-call';
import { toggleFavoriteRequest } from '../services/profiles-api';
import type { ModelProfile } from '../types/model-profile';
import { cn, maskDisplayName } from '@/utils';

const femaleAttrOrder = [
  'breastSize',
  'buttType',
  'skinTone',
  'hair',
  'height',
  'bodyType',
  'bust',
  'waist',
  'hips',
  'tattoos',
  'vibe',
];

const maleAttrOrder = [
  'bodyBuild',
  'penisSize',
  'skinTone',
  'hair',
  'height',
  'bodyType',
  'penisGirth',
  'tattoos',
  'vibe',
];

const attrLabels: Record<string, string> = {
  height: 'Altura',
  bodyType: 'Complexión',
  bodyBuild: 'Complexión',
  skinTone: 'Tono de piel',
  breastSize: 'Senos',
  buttType: 'Glúteos',
  bust: 'Busto',
  waist: 'Cintura',
  hips: 'Cadera',
  tattoos: 'Tatuajes',
  hair: 'Cabello',
  vibe: 'Estilo',
  penisSize: 'Miembro',
  penisGirth: 'Grosor',
};

interface Props {
  model: ModelProfile;
  onClose: () => void;
  onFavoriteChange?: (modelUserId: string, favorited: boolean) => void;
}

export function ModelProfileModal({ model, onClose, onFavoriteChange }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [favorited, setFavorited] = useState(Boolean(model.isFavorited));

  useEffect(() => {
    setFavorited(Boolean(model.isFavorited));
  }, [model.isFavorited, model.userId]);

  const order = model.gender === 'MALE' ? maleAttrOrder : femaleAttrOrder;
  const attrs = order
    .filter((key) => model.attributes[key] != null && model.attributes[key] !== '')
    .map((key) => ({
      key,
      label: attrLabels[key] ?? key,
      value: formatAttrValue(key, String(model.attributes[key])),
    }));

  const favoriteMutation = useMutation({
    mutationFn: () => toggleFavoriteRequest(model.userId),
    onSuccess: (data) => {
      setFavorited(data.favorited);
      onFavoriteChange?.(model.userId, data.favorited);
      void queryClient.invalidateQueries({ queryKey: ['models'] });
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const openConfirm = useVideoCallStore((s) => s.openConfirm);

  function startChat() {
    onClose();
    navigate('/chats', {
      state: {
        peer: {
          userId: model.userId,
          displayName: model.displayName,
          username: model.username,
          avatarUrl: model.avatarUrl,
        },
      },
    });
  }

  function startVideo() {
    onClose();
    openConfirm({
      userId: model.userId,
      displayName: model.displayName,
      username: model.username,
      avatarUrl: model.avatarUrl,
      videoPricePerMin: model.videoPricePerMin,
    });
  }

  function goToProfile() {
    onClose();
    navigate(`/profile/${model.username}`);
  }

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

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="relative aspect-[4/5] max-h-[42vh] shrink-0 overflow-hidden bg-zinc-800">
            {model.avatarUrl ? (
              <img
                src={mediaSrc(model.avatarUrl)}
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
            <span
              className={cn(
                'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur',
                model.isOnline ? 'bg-black/50 text-white' : 'bg-black/50 text-zinc-300',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  model.isOnline ? 'bg-vibra-online' : 'bg-zinc-500',
                )}
              />
              {model.isOnline ? 'En línea' : 'No disponible'}
            </span>
          </div>

          <div className="space-y-5 px-5 pb-6 pt-2">
            <div>
              <h2 className="font-display text-2xl font-bold">
                <span className="inline-flex max-w-full items-center gap-1.5">
                  <span className="truncate">{maskDisplayName(model.displayName)}</span>
                  {model.isVerified ? <VerifiedBadge className="h-5 w-5" /> : null}
                </span>
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {model.age ? `${model.age} · ` : ''}@{model.username}
              </p>
              <p
                className={cn(
                  'mt-1 text-xs font-medium',
                  model.isOnline ? 'text-vibra-online' : 'text-zinc-500',
                )}
              >
                {model.isOnline
                  ? 'Disponible ahora para chat y videollamada'
                  : 'No está en línea en este momento'}
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
                  {attrs.map((item) => {
                    const kind = attrKindFromKey(item.key);
                    const optionId = String(model.attributes[item.key] ?? '');
                    return (
                      <div
                        key={item.key}
                        className="rounded-xl border border-vibra-border bg-vibra-muted/60 px-3 py-2"
                      >
                        <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-zinc-500">
                          {kind ? (
                            <BodyAttrIcon
                              kind={kind}
                              optionId={optionId}
                              className="h-4 w-4 text-vibra-pink"
                            />
                          ) : null}
                          {item.label}
                        </dt>
                        <dd className="mt-0.5 text-sm text-zinc-200">{item.value}</dd>
                      </div>
                    );
                  })}
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
                onClick={startChat}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-vibra-pink py-3 text-sm font-semibold transition hover:bg-vibra-pink-hover"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </button>
              <button
                type="button"
                onClick={startVideo}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-vibra-pink py-3 text-sm font-semibold text-vibra-pink transition hover:bg-vibra-pink/10"
              >
                <Video className="h-4 w-4" />
                Video
              </button>
              <button
                type="button"
                disabled={favoriteMutation.isPending}
                onClick={() => favoriteMutation.mutate()}
                className={cn(
                  'rounded-xl border p-3 transition disabled:opacity-60',
                  favorited
                    ? 'border-vibra-pink bg-vibra-pink/20 text-vibra-pink'
                    : 'border-vibra-border text-zinc-300 hover:border-vibra-pink/50 hover:text-vibra-pink',
                )}
                aria-label={favorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                title={favorited ? 'Quitar de favoritos' : 'Guardar favorito'}
              >
                <Heart className={cn('h-5 w-5', favorited && 'fill-current')} />
              </button>
            </div>

            <button
              type="button"
              onClick={goToProfile}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-vibra-border py-3 text-sm font-semibold text-white transition hover:border-vibra-pink/50"
            >
              <UserRound className="h-4 w-4" />
              Ir a perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
