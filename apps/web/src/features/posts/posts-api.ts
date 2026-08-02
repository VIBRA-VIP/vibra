import { api } from '@/services/api';

export type PostMediaDto = {
  id: string;
  kind: 'IMAGE' | 'VIDEO';
  url: string;
  sortOrder: number;
};

export type PostAuthorDto = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isVerified: boolean;
};

export type FeedPostDto = {
  id: string;
  text: string;
  visibility: 'FREE' | 'PAID';
  priceCredits: number | null;
  locked: boolean;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  isFollowing: boolean;
  author: PostAuthorDto;
  media: PostMediaDto[];
};

export type PostCommentDto = {
  id: string;
  text: string;
  createdAt: string;
  author: {
    userId: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
};

export async function fetchFeedPosts() {
  const { data } = await api.get<FeedPostDto[]>('/api/posts/feed');
  return data;
}

export async function fetchPostsByAuthor(authorId: string) {
  const { data } = await api.get<FeedPostDto[]>(`/api/posts/by/${authorId}`);
  return data;
}

export async function createPostRequest(payload: {
  text?: string;
  visibility: 'FREE' | 'PAID';
  priceCredits?: number;
  media: { url: string; kind: 'IMAGE' | 'VIDEO' }[];
}) {
  const { data } = await api.post<FeedPostDto>('/api/posts', payload);
  return data;
}

export async function togglePostLikeRequest(postId: string) {
  const { data } = await api.post<{ liked: boolean; likesCount: number }>(
    `/api/posts/${postId}/like`,
  );
  return data;
}

export async function fetchPostComments(postId: string) {
  const { data } = await api.get<PostCommentDto[]>(`/api/posts/${postId}/comments`);
  return data;
}

export async function addPostCommentRequest(postId: string, text: string) {
  const { data } = await api.post<PostCommentDto>(`/api/posts/${postId}/comments`, { text });
  return data;
}
