import { Heart, Images, Lock, Play } from 'lucide-react';
import { mediaSrc } from '@/features/media/services/media-api';
import { cn } from '@/utils';
import type { FeedPostDto } from './posts-api';

type Props = {
  post: FeedPostDto;
  onOpen?: (post: FeedPostDto) => void;
};

export function PostGridTile({ post, onOpen }: Props) {
  const cover = post.media[0];
  const multi = post.media.length > 1;
  const isVideo = cover?.kind === 'VIDEO';

  return (
    <button
      type="button"
      onClick={() => onOpen?.(post)}
      className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/10 transition hover:ring-vibra-pink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-vibra-pink"
    >
      {cover ? (
        isVideo ? (
          <video
            src={mediaSrc(cover.url)}
            className={cn(
              'h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]',
              post.locked && 'scale-110 blur-xl brightness-50',
            )}
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={mediaSrc(cover.url)}
            alt=""
            className={cn(
              'h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]',
              post.locked && 'scale-110 blur-xl brightness-50',
            )}
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 px-3 text-center text-xs text-zinc-500">
          {post.text?.slice(0, 80) || 'Publicación'}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />

      {post.locked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/35">
          <Lock className="h-6 w-6 text-vibra-gold" />
          <span className="text-[11px] font-semibold text-white">
            {post.priceCredits ?? 100} créd
          </span>
        </div>
      ) : null}

      <div className="absolute right-2 top-2 flex items-center gap-1">
        {isVideo && !post.locked ? (
          <span className="rounded-md bg-black/55 p-1 text-white backdrop-blur-sm">
            <Play className="h-3.5 w-3.5 fill-current" />
          </span>
        ) : null}
        {multi ? (
          <span className="rounded-md bg-black/55 p-1 text-white backdrop-blur-sm">
            <Images className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>

      <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
        <Heart className={cn('h-3 w-3', post.likedByMe && 'fill-vibra-pink text-vibra-pink')} />
        {post.likesCount}
      </div>
    </button>
  );
}
