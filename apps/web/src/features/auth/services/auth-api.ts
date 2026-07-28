import { api } from '@/services';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  profile: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  walletBalance: number;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function registerRequest(payload: {
  email: string;
  password: string;
  username: string;
  displayName: string;
}) {
  const { data } = await api.post<AuthResponse>('/api/auth/register', payload);
  return data;
}

export async function loginRequest(payload: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
  return data;
}

export async function meRequest() {
  const { data } = await api.get<AuthUser>('/api/auth/me');
  return data;
}

export async function logoutRequest(refreshToken?: string) {
  await api.post('/api/auth/logout', { refreshToken });
}
