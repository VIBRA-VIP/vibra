/**
 * Chat storage MUST be scoped per authenticated user.
 * Never use a shared localStorage key for conversations/messages.
 * Mixing accounts caused models (e.g. new profiles) to see other users' chats.
 */

export type StoredChatPeer = {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export type StoredChatMessage = {
  id: string;
  text: string;
  at: number;
  fromMe: boolean;
  senderId: string;
};

export type StoredConversation = {
  id: string;
  ownerId: string;
  peer: StoredChatPeer;
  messages: StoredChatMessage[];
  updatedAt: number;
};

const LEGACY_SHARED_KEY = 'vibra_local_chats';
const KEY_PREFIX = 'vibra_local_chats:';

export function chatStorageKey(ownerId: string): string {
  if (!ownerId.trim()) {
    throw new Error('chatStorageKey requires a non-empty ownerId');
  }
  return `${KEY_PREFIX}${ownerId}`;
}

/** Removes the unsafe shared key that leaked chats across accounts. */
export function purgeLegacySharedChatStorage(): void {
  try {
    localStorage.removeItem(LEGACY_SHARED_KEY);
  } catch {
    // ignore
  }
}

function isConversation(value: unknown, ownerId: string): value is StoredConversation {
  if (!value || typeof value !== 'object') return false;
  const c = value as StoredConversation;
  return (
    typeof c.id === 'string' &&
    c.ownerId === ownerId &&
    typeof c.peer?.userId === 'string' &&
    c.peer.userId !== ownerId &&
    Array.isArray(c.messages)
  );
}

export function loadUserChatThreads(ownerId: string | null | undefined): StoredConversation[] {
  purgeLegacySharedChatStorage();
  if (!ownerId) return [];

  try {
    const raw = localStorage.getItem(chatStorageKey(ownerId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredConversation => isConversation(item, ownerId));
  } catch {
    return [];
  }
}

export function saveUserChatThreads(
  ownerId: string | null | undefined,
  threads: StoredConversation[],
): void {
  if (!ownerId) return;
  purgeLegacySharedChatStorage();
  const safe = threads.filter((c) => isConversation(c, ownerId));
  localStorage.setItem(chatStorageKey(ownerId), JSON.stringify(safe));
}

export function clearUserChatThreads(ownerId: string | null | undefined): void {
  if (!ownerId) return;
  try {
    localStorage.removeItem(chatStorageKey(ownerId));
  } catch {
    // ignore
  }
  purgeLegacySharedChatStorage();
}
