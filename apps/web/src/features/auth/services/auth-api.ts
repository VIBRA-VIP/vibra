import { api } from '@/services';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  acceptedTermsAt?: string | null;
  createdAt: string;
  needsOnboarding?: boolean;
  needsVerification?: boolean;
  verificationStatus?: string;
  profile: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    bio?: string | null;
    gender?: string;
    tags?: string[];
    profileCompleted?: boolean;
    verificationStatus?: string;
    isVerified?: boolean;
    hasIdDocument?: boolean;
    chatPricePerMin?: number;
    videoPricePerMin?: number;
    messagePrice?: number;
    contentPrice?: number;
    acceptsEncounters?: boolean;
    attributes?: Record<string, unknown>;
    payoutBankId?: number | null;
    payoutAccountType?: string | null;
    payoutAccount?: string | null;
    payoutHolder?: string | null;
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
  displayName: string;
  role: 'CLIENT' | 'MODEL';
  gender: 'FEMALE' | 'MALE';
  acceptedTerms: boolean;
  idDocumentUrl?: string;
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
