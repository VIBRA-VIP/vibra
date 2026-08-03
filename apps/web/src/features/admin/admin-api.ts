import { api } from '@/services';

const ADMIN_TOKEN_KEY = 'vibra_admin_token';

export type PendingModelDto = {
  userId: string;
  email: string;
  displayName: string;
  username: string;
  gender: string;
  age: number;
  birthDate: string | null;
  avatarUrl: string | null;
  idDocumentUrl: string | null;
  idDocumentBackUrl: string | null;
  verificationStatus: string;
  verificationSubmittedAt: string | null;
  profileCompleted: boolean;
  createdAt: string;
};

export type AdminDashboardDto = {
  generatedAt: string;
  users: {
    totalUsers: number;
    totalClients: number;
    totalModels: number;
    activeUsers: number;
    newThisMonth: number;
    newLast30Days: number;
    modelsPending: number;
    modelsApproved: number;
    modelsRejected: number;
    monthly: { month: string; total: number; clients: number; models: number }[];
  };
  system: {
    hostname: string;
    platform: string;
    uptimeSec: number;
    cpuCount: number;
    cpuModel: string;
    loadAvg1: number;
    loadAvg5: number;
    loadAvg15: number;
    cpuUsageRatio: number;
    memory: {
      totalBytes: number;
      usedBytes: number;
      freeBytes: number;
      usedRatio: number;
    };
  };
  disk: {
    path: string | null;
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    availableBytes: number;
    usedRatio: number;
    error?: string;
  };
  s3: {
    configured: boolean;
    bucket: string | null;
    region: string;
    objectCount: number;
    totalBytes: number;
    truncated?: boolean;
    error?: string;
  };
};

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminUnlockRequest(key: string) {
  const { data } = await api.post<{ accessToken: string; expiresIn: string }>(
    '/api/admin/unlock',
    { key },
  );
  return data;
}

function adminHeaders() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchAdminDashboardRequest() {
  const { data } = await api.get<AdminDashboardDto>('/api/admin/dashboard', {
    headers: adminHeaders(),
  });
  return data;
}

export async function listPendingModelsRequest() {
  const { data } = await api.get<PendingModelDto[]>('/api/admin/models/pending', {
    headers: adminHeaders(),
  });
  return data;
}

export async function approveModelRequest(userId: string) {
  const { data } = await api.post(
    `/api/admin/models/${userId}/approve`,
    {},
    { headers: adminHeaders() },
  );
  return data;
}

export async function rejectModelRequest(userId: string) {
  const { data } = await api.post(
    `/api/admin/models/${userId}/reject`,
    {},
    { headers: adminHeaders() },
  );
  return data;
}
