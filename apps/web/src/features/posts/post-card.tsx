import { useMemo, useState } from 'react';
import { Heart, MessageCircle, Star, UserRound, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaSrc } from '@/features/media/services/media-api';
import { toggleFavoriteRequest } from '@/features/profiles/services/profiles-api';
import { cn } from '@/utils';
import { togglePostLikeRequest, type FeedPostDto } from './posts-api';

function formatPostDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type Props = {
  post: FeedPostDto;
  onOpenProfile?: (userId: string) => void;
  onOpenComments?: (postId: string) => void;
};

export function PostCard({ post, onOpenProfile, onOpenComments }: Props) {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [following, setFollowing] = useState(post.isFollowing);
  const [burst, setBurst] = useState(false);

  const slides = useMemo(() => post.media, [post.media]);
  const current = slides[index] ?? slides[0];

  const likeMutation = useMutation({
    mutationFn: () => togglePostLikeRequest(post.id),
    onSuccess: (data) => {
      setLiked(data.liked);
      setLikesCount(data.likesCount);
      if (data.liked) {
        setBurst(true);
        window.setTimeout(() => setBurst(false), 450);
      }
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const followMutation = useMutation({
    mutationFn: () => toggleFavoriteRequest(post.author.userId),
    onSuccess: (data) => {
      setFollowing(data.favorited);
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });

  function prev() {
    setIndex((i) => (i <= 0 ? slides.length - 1 : i - 1));
  }
  function next() {
    setIndex((i) => (i >= slides.length - 1 ? 0 : i + 1));
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-vibra-border bg-vibra-elevated">
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => onOpenProfile?.(post.author.userId)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {post.author.avatarUrl ? (
            <img
              src={mediaSrc(post.author.avatarUrl)}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-vibra-border"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold">
              {post.author.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {post.author.displayName}{' '}
              {post.author.isVerified ? <span className="text-vibra-pink">✓</span> : null}
            </p>
            <p className="truncate text-xs text-zinc-500">
              @{post.author.username} · {formatPostDate(post.createdAt)}
            </p>
          </div>
        </button>
        {post.visibility === 'PAID' ? (
          <span className="rounded-full bg-vibra-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-vibra-gold">
            Pago
          </span>
        ) : (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Gratis
          </span>
        )}
      </header>

      {post.text ? (
        <p className="whitespace-pre-wrap px-4 pb-3 text-sm leading-relaxed text-zinc-200">
          {post.text}
        </p>
      ) : null}

      {current ? (
        <div className="relative aspect-[4/5] bg-zinc-900">
          {current.kind === 'VIDEO' ? (
            <video
              key={current.id}
              src={mediaSrc(current.url)}
              className={cn(
                'h-full w-full object-cover',
                post.locked && 'scale-110 blur-2xl brightness-50 saturate-50',
              )}
              controls={!post.locked}
              playsInline
              muted={post.locked}
            />
          ) : (
            <img
              src={mediaSrc(current.url)}
              alt=""
              className={cn(
                'h-full w-full object-cover transition',
                post.locked && 'scale-110 blur-2xl brightness-50 saturate-50',
              )}
            />
          )}

          {post.locked ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-black/80 via-black/40 to-black/20 px-6 text-center">
              <Lock className="h-8 w-8 text-vibra-gold" />
              <p className="text-sm font-semibold text-white">Contenido exclusivo</p>
              <p className="text-xs text-zinc-300">
                Desbloquea por {post.priceCredits ?? 100} créditos
              </p>
            </div>
          ) : null}

          {slides.length > 1 && !post.locked ? (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {slides.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      i === index ? 'bg-white' : 'bg-white/40',
                    )}
                  />
                ))}
              </div>
            </>
          ) : null}

          {burst ? (
            <Heart className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 animate-ping fill-vibra-pink text-vibra-pink" />
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          disabled={likeMutation.isPending}
          onClick={() => likeMutation.mutate()}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition',
            liked ? 'text-vibra-pink' : 'text-zinc-300 hover:text-white',
          )}
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-transform',
              liked && 'fill-current scale-110',
              burst && 'scale-125',
            )}
          />
          {likesCount}
        </button>
        <button
          type="button"
          onClick={() => onOpenComments?.(post.id)}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:text-white"
        >
          <MessageCircle className="h-5 w-5" />
          {post.commentsCount}
        </button>
        <button
          type="button"
          disabled={followMutation.isPending}
          onClick={() => followMutation.mutate()}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition',
            following ? 'text-vibra-gold' : 'text-zinc-300 hover:text-white',
          )}
        >
          <Star className={cn('h-5 w-5', following && 'fill-current')} />
          {following ? 'Siguiendo' : 'Seguir'}
        </button>
        <button
          type="button"
          onClick={() => onOpenProfile?.(post.author.userId)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:text-white"
        >
          <UserRound className="h-5 w-5" />
          Perfil
        </button>
      </div>
    </article>
  );
}
