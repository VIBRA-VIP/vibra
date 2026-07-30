import { api } from '@/services/api';

export type ChatPeer = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isOnline?: boolean;
};

export type ChatMessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
  fromMe: boolean;
};

export type ChatConversationDto = {
  id: string;
  lastMessageAt: string | null;
  updatedAt: string;
  unreadCount?: number;
  peer: ChatPeer | null;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    fromMe: boolean;
  } | null;
};

export async function listConversationsRequest() {
  const { data } = await api.get<ChatConversationDto[]>('/api/chat/conversations');
  return data;
}

export async function openChatWithRequest(peerUserId: string) {
  const { data } = await api.post<ChatConversationDto>(`/api/chat/with/${peerUserId}`);
  return data;
}

export async function listMessagesRequest(conversationId: string) {
  const { data } = await api.get<ChatMessageDto[]>(
    `/api/chat/conversations/${conversationId}/messages`,
  );
  return data;
}

export async function sendMessageRequest(conversationId: string, content: string) {
  const { data } = await api.post<ChatMessageDto>(
    `/api/chat/conversations/${conversationId}/messages`,
    { content },
  );
  return data;
}
