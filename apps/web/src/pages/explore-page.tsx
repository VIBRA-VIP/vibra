import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PostCard, PostCommentsSheet, fetchFeedPosts } from '@/features/posts';
import { ModelProfileModal, type ModelProfile } from '@/features/profiles';
import { useAuthStore } from '@/store';

export function ExplorePage() {
  const user = useAuthStore((s) => s.user);
  const isModel = user?.role === 'MODEL';
  const [selected, setSelected] = useState<ModelProfile | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const feedQuery = useQuery({
    queryKey: ['posts', 'feed'],
    queryFn: fetchFeedPosts,
    enabled: !isModel,
  });

  function openProfileFromPost(userId: string) {
    const post = (feedQuery.data ?? []).find((p) => p.author.userId === userId);
    if (!post) return;
    setSelected({
      id: post.author.userId,
      userId: post.author.userId,
      displayName: post.author.displayName,
      username: post.author.username,
      avatarUrl: post.author.avatarUrl,
      bannerUrl: null,
      age: 0,
      isOnline: false,
      isAvailable: false,
      isVerified: post.author.isVerified,
      rating: 0,
      ratingCount: 0,
      chatPricePerMin: 0,
      videoPricePerMin: 0,
      tags: [],
      gender: 'FEMALE',
      bio: null,
      attributes: {},
      services: [],
      isFavorited: post.isFollowing,
    });
  }

  if (isModel) {
    return <Navigate to="/requests" replace />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Explorar</h1>
        <p className="mt-1 text-sm text-zinc-400">Publicaciones de las modelos</p>
      </div>

      <div className="space-y-4">
        {feedQuery.isLoading ? (
          <p className="text-sm text-zinc-500">Cargando...</p>
        ) : (feedQuery.data ?? []).length > 0 ? (
          (feedQuery.data ?? []).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenProfile={openProfileFromPost}
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

      {selected ? (
        <ModelProfileModal
          model={selected}
          onClose={() => setSelected(null)}
          onFavoriteChange={(modelUserId, favorited) => {
            setSelected((prev) =>
              prev && prev.userId === modelUserId ? { ...prev, isFavorited: favorited } : prev,
            );
          }}
        />
      ) : null}

      {commentsPostId ? (
        <PostCommentsSheet postId={commentsPostId} onClose={() => setCommentsPostId(null)} />
      ) : null}
    </div>
  );
}
