import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PostCard, PostCommentsSheet, fetchFeedPosts } from '@/features/posts';
import { useAuthStore } from '@/store';

export function ExplorePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isModel = user?.role === 'MODEL';
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const feedQuery = useQuery({
    queryKey: ['posts', 'feed'],
    queryFn: fetchFeedPosts,
    enabled: !isModel,
  });

  if (isModel) {
    return <Navigate to="/requests" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 text-left">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Explorar</h1>
        <p className="mt-1 text-sm text-zinc-400">Publicaciones de las modelos</p>
      </div>

      <div className="mx-auto max-w-lg space-y-4">
        {feedQuery.isLoading ? (
          <p className="text-center text-sm text-zinc-500">Cargando...</p>
        ) : (feedQuery.data ?? []).length > 0 ? (
          (feedQuery.data ?? []).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenProfile={(username) => navigate(`/profile/${username}`)}
              onOpenComments={setCommentsPostId}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-vibra-border px-4 py-14 text-center">
            <p className="font-display text-lg font-semibold text-white">Pronto habrá contenido</p>
            <p className="mt-2 text-sm text-zinc-500">
              Mientras tanto, conoce modelos en la sección Conocer.
            </p>
          </div>
        )}
      </div>

      {commentsPostId ? (
        <PostCommentsSheet postId={commentsPostId} onClose={() => setCommentsPostId(null)} />
      ) : null}
    </div>
  );
}
