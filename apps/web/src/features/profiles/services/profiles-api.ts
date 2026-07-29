import { api } from '@/services';
import type { ModelProfile } from '../types/model-profile';

export type ClientProfile = {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  gender: 'FEMALE' | 'MALE';
  age: number;
  isOnline: boolean;
};

export type ClientsListResponse = {
  totalClients: number;
  onlineClients: number;
  clients: ClientProfile[];
};

export async function fetchModels(params?: {
  gender?: string;
  filter?: string;
  q?: string;
}) {
  const { data } = await api.get<ModelProfile[]>('/api/profiles/models', { params });
  return data;
}

export async function fetchClients(params?: {
  gender?: string;
  filter?: string;
  q?: string;
}) {
  const { data } = await api.get<ClientsListResponse>('/api/profiles/clients', { params });
  return data;
}

export async function toggleFavoriteRequest(modelUserId: string) {
  const { data } = await api.post<{ favorited: boolean; modelId: string }>(
    `/api/profiles/favorites/${modelUserId}`,
  );
  return data;
}
