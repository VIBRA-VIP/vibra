import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Star,
  UserRound,
  ChevronLeft,
  ChevronRight,
  Lock,
  Coins,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VerifiedBadge } from '@/components/verified-badge';
import { mediaSrc } from '@/features/media/services/media-api';
import { toggleFavoriteRequest } from '@/features/profiles/services/profiles-api';
import { useAuthStore } from '@/store';
import { cn, maskDisplayName } from '@/utils';
import { PostCommentsInline } from './post-comments-inline';
import { togglePostLikeRequest, unlockPostRequest, type FeedPostDto } from './posts-api';

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
  onOpenProfile?: (username: string) => void;
  /** Hide follow / profile actions (e.g. own profile). */
  hideFollow?: boolean;
  onUnlocked?: (post: FeedPostDto) => void;
};

export function PostCard({ post, onOpenProfile, hideFollow = false, onUnlocked }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [view, setView] = useState(post);
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [following, setFollowing] = useState(post.isFollowing);
  const [burst, setBurst] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const slides = useMemo(() => view.media, [view.media]);
  const current = slides[index] ?? slides[0];
  const price = view.priceCredits ?? 100;
  const balance = user?.walletBalance ?? 0;
  const canAfford = balance >= price;

  const likeMutation = useMutation({
    mutationFn: () => togglePostLikeRequest(view.id),
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
    mutationFn: () => toggleFavoriteRequest(view.author.userId),
    onSuccess: (data) => {
      setFollowing(data.favorited);
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });

  const unlockMutation = useMutation({
    mutationFn: () => unlockPostRequest(view.id),
    onSuccess: (data) => {
      setPayError(null);
      setView(data.post);
      onUnlocked?.(data.post);
      if (user && data.clientBalance != null) {
        setUser({ ...user, walletBalance: data.clientBalance });
      }
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err: { response?: { data?: { message?: string | string[] } } }) => {
      const raw = err.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : raw;
      setPayError(msg ?? 'No se pudo desbloquear');
    },
  });

  useEffect(() => {
    setView(post);
    setLiked(post.likedByMe);
    setLikesCount(post.likesCount);
    setCommentsCount(post.commentsCount);
    setFollowing(post.isFollowing);
  }, [post]);

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
          onClick={() => onOpenProfile?.(view.author.username)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {view.author.avatarUrl ? (
            <img
              src={mediaSrc(view.author.avatarUrl)}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-vibra-border"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold">
              {view.author.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              <span className="inline-flex max-w-full items-center gap-1">
                <span className="truncate">{maskDisplayName(view.author.displayName)}</span>
                {view.author.isVerified ? <VerifiedBadge className="h-3.5 w-3.5" /> : null}
              </span>
            </p>
            <p className="truncate text-xs text-zinc-500">
              @{view.author.username} · {formatPostDate(view.createdAt)}
            </p>
          </div>
        </button>
        {view.visibility === 'PAID' ? (
          <span className="rounded-full bg-vibra-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-vibra-gold">
            Pago
          </span>
        ) : (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Gratis
          </span>
        )}
      </header>

      {view.text ? (
        <p className="whitespace-pre-wrap px-4 pb-3 text-sm leading-relaxed text-zinc-200">
          {view.text}
        </p>
      ) : null}

      {current ? (
        <div className="relative aspect-[4/5] bg-zinc-900">
          {!view.locked && current.url ? (
            current.kind === 'VIDEO' ? (
              <video
                key={current.id}
                src={mediaSrc(current.url)}
                className="h-full w-full object-cover"
                controls
                playsInline
              />
            ) : (
              <img
                src={mediaSrc(current.url)}
                alt=""
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-zinc-800 to-zinc-950" />
          )}

          {view.locked ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 px-6 text-center">
              <Lock className="h-8 w-8 text-vibra-gold" />
              <div>
                <p className="text-sm font-semibold text-white">Contenido exclusivo</p>
                <p className="mt-1 text-xs text-zinc-300">
                  Paga {price} créditos para verlo completo
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">Tu saldo: {balance} créd</p>
              </div>
              <button
                type="button"
                disabled={unlockMutation.isPending}
                onClick={() => {
                  setPayError(null);
                  if (!canAfford) {
                    setPayError(`Necesitas ${price} créditos. Saldo: ${balance}`);
                    return;
                  }
                  unlockMutation.mutate();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-vibra-gold px-5 py-2.5 text-sm font-bold text-black shadow-lg transition hover:bg-vibra-gold/90 disabled:opacity-50"
              >
                <Coins className="h-4 w-4" />
                {unlockMutation.isPending ? 'Pagando…' : `Pagar ${price} créd`}
              </button>
              {payError ? (
                <div className="space-y-1">
                  <p className="text-xs text-red-300">{payError}</p>
                  {!canAfford ? (
                    <button
                      type="button"
                      onClick={() => navigate('/credits')}
                      className="text-xs font-semibold text-vibra-gold underline"
                    >
                      Comprar créditos
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {slides.length > 1 && !view.locked ? (
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            likeMutation.mutate();
          }}
          className={cn(
            'relative z-10 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm transition',
            liked ? 'text-vibra-pink' : 'text-zinc-300 hover:text-white',
          )}
          aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
        >
          <Heart
            className={cn(
              'pointer-events-none h-5 w-5 shrink-0 transition-transform',
              liked && 'scale-110 fill-current',
              burst && 'scale-125',
            )}
          />
          <span className="pointer-events-none tabular-nums">{likesCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen((v) => !v)}
          className={cn(
            'relative z-10 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm transition',
            commentsOpen ? 'text-vibra-pink' : 'text-zinc-300 hover:text-white',
          )}
          aria-expanded={commentsOpen}
          aria-label="Comentarios"
        >
          <MessageCircle className="pointer-events-none h-5 w-5 shrink-0" />
          <span className="pointer-events-none tabular-nums">{commentsCount}</span>
        </button>
        {!hideFollow ? (
          <>
            <button
              type="button"
              disabled={followMutation.isPending}
              onClick={() => followMutation.mutate()}
              className={cn(
                'relative z-10 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm transition',
                following ? 'text-vibra-gold' : 'text-zinc-300 hover:text-white',
              )}
            >
              <Star
                className={cn(
                  'pointer-events-none h-5 w-5 shrink-0',
                  following && 'fill-current',
                )}
              />
              <span className="pointer-events-none">
                {following ? 'Siguiendo' : 'Seguir'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onOpenProfile?.(view.author.username)}
              className="relative z-10 ml-auto inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:text-white"
            >
              <UserRound className="pointer-events-none h-5 w-5 shrink-0" />
              <span className="pointer-events-none">Perfil</span>
            </button>
          </>
        ) : null}
      </div>

      <PostCommentsInline
        postId={view.id}
        open={commentsOpen}
        onCountChange={setCommentsCount}
      />
    </article>
  );
}
