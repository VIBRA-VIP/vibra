import { api } from '@/services';

export type VideoCallPeer = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export type VideoCallDto = {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  roomName: string;
  pricePerMin: number;
  prepaidMinutes: number;
  extraMinutes: number;
  extendOptions: number[];
  totalCredits: number;
  creditsSpent: number;
  startedAt: string | null;
  endedAt: string | null;
  endsAt: string | null;
  createdAt: string;
  waitedSeconds: number;
  client: VideoCallPeer;
  model: VideoCallPeer;
};

export type VideoCallTarget = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  videoPricePerMin: number;
};

export async function createVideoCallRequest(modelId: string) {
  const { data } = await api.post<VideoCallDto>('/api/video-call', { modelId });
  return data;
}

export async function listPendingVideoCallsRequest() {
  const { data } = await api.get<VideoCallDto[]>('/api/video-call/pending');
  return data;
}

export async function getVideoCallRequest(id: string) {
  const { data } = await api.get<VideoCallDto>(`/api/video-call/${id}`);
  return data;
}

export async function acceptVideoCallRequest(id: string) {
  const { data } = await api.post<VideoCallDto>(`/api/video-call/${id}/accept`);
  return data;
}

export async function declineVideoCallRequest(id: string) {
  const { data } = await api.post<VideoCallDto>(`/api/video-call/${id}/decline`);
  return data;
}

export async function endVideoCallRequest(id: string) {
  const { data } = await api.post<VideoCallDto>(`/api/video-call/${id}/end`);
  return data;
}

export type VideoCallExtendedEvent = VideoCallDto & {
  addedMinutes: number;
  addedCredits: number;
  clientBalance: number;
  modelBalance: number;
};

export async function extendVideoCallRequest(id: string, minutes: number) {
  const { data } = await api.post<VideoCallExtendedEvent>(`/api/video-call/${id}/extend`, {
    minutes,
  });
  return data;
}

export type GiftCatalogItem = {
  id: string;
  emoji: string;
  label: string;
  credits: number;
};

export type VideoCallGiftEvent = {
  callId: string;
  gift: GiftCatalogItem;
  from: { userId: string; displayName: string };
  to: { userId: string; displayName: string };
  clientBalance: number;
  modelBalance: number;
  createdAt: string;
};

export async function listGiftsRequest() {
  const { data } = await api.get<GiftCatalogItem[]>('/api/video-call/gifts');
  return data;
}

export async function sendGiftRequest(callId: string, giftId: string) {
  const { data } = await api.post<VideoCallGiftEvent>(`/api/video-call/${callId}/gifts`, {
    giftId,
  });
  return data;
}
