import { api } from '@/services';

export async function getMyProfile() {
  const { data } = await api.get('/api/profiles/me');
  return data;
}

export async function completeProfileRequest(payload: Record<string, unknown>) {
  const { data } = await api.post('/api/profiles/complete', payload);
  return data;
}

export async function updateSettingsRequest(payload: Record<string, unknown>) {
  const { data } = await api.patch('/api/profiles/settings', payload);
  return data;
}

export async function updatePayoutRequest(payload: {
  payoutProvider: string;
  payoutAccount: string;
  payoutHolder: string;
}) {
  const { data } = await api.patch('/api/profiles/payout', payload);
  return data;
}
