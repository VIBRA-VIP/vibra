import { api } from '@/services';
import type { ModelProfile } from '../types/model-profile';

export async function fetchModels(params?: {
  gender?: string;
  filter?: string;
  q?: string;
}) {
  const { data } = await api.get<ModelProfile[]>('/api/profiles/models', { params });
  return data;
}
