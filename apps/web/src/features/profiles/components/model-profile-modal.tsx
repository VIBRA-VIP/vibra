import { useEffect, useState } from 'react';
import { Heart, MessageCircle, UserRound, Video, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaSrc } from '@/features/media/services/media-api';
import { toggleFavoriteRequest } from '../services/profiles-api';
import type { ModelProfile } from '../types/model-profile';
import { cn } from '@/utils';

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

  const favoriteMutation = useMutation({
    mutationFn: () => toggleFavoriteRequest(model.userId),
    onSuccess: (data) => {
      setFavorited(data.favorited);
      onFavoriteChange?.(model.userId, data.favorited);
      void queryClient.invalidateQueries({ queryKey: ['models'] });
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

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
          <div className="relative aspect-[4/5] max-h-[48vh] shrink-0 overflow-hidden bg-zinc-800">
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

          <div className="space-y-4 px-5 pb-6 pt-2">
            <div>
              <h2 className="font-display text-2xl font-bold">
                {model.displayName}{' '}
                {model.isVerified ? <span className="text-vibra-pink">✓</span> : null}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {model.age ? `${model.age} · ` : ''}@{model.username}
              </p>
            </div>

            {model.bio ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400">{model.bio}</p>
            ) : null}

            <button
              type="button"
              onClick={goToProfile}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-vibra-pink py-3 text-sm font-semibold transition hover:bg-vibra-pink-hover"
            >
              <UserRound className="h-4 w-4" />
              Ir a perfil
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={startChat}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-vibra-border py-3 text-sm font-semibold text-zinc-200"
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
                disabled={favoriteMutation.isPending}
                onClick={() => favoriteMutation.mutate()}
                className={cn(
                  'rounded-xl border p-3 transition disabled:opacity-60',
                  favorited
                    ? 'border-vibra-pink bg-vibra-pink/20 text-vibra-pink'
                    : 'border-vibra-border text-zinc-300',
                )}
                aria-label={favorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <Heart className={cn('h-5 w-5', favorited && 'fill-current')} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
