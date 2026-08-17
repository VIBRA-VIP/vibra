export enum UserRole {
  CLIENT = 'CLIENT',
  MODEL = 'MODEL',
  ADMIN = 'ADMIN',
}

export enum MediaType {
  AVATAR = 'AVATAR',
  BANNER = 'BANNER',
  GALLERY = 'GALLERY',
  VIDEO = 'VIDEO',
  CHAT_IMAGE = 'CHAT_IMAGE',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  EMOJI = 'EMOJI',
  SYSTEM = 'SYSTEM',
}

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  CHAT = 'CHAT',
  VIDEO_CALL = 'VIDEO_CALL',
  GIFT = 'GIFT',
  REFUND = 'REFUND',
  ADMIN_ADJUST = 'ADMIN_ADJUST',
  PAYOUT = 'PAYOUT',
}

export enum VideoCallStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationType {
  MESSAGE = 'MESSAGE',
  VIDEO_CALL = 'VIDEO_CALL',
  FOLLOW = 'FOLLOW',
  SYSTEM = 'SYSTEM',
  CREDITS = 'CREDITS',
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPublic {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
}

export interface ProfilePublic {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isOnline: boolean;
  isAvailable: boolean;
  rating: number;
  chatPricePerMin: number;
  videoPricePerMin: number;
  socialLinks: Record<string, string> | null;
}

export const CREDIT_PACKAGES = [
  { id: 'pack_30', credits: 30, label: '30 créditos' },
  { id: 'pack_100', credits: 100, label: '100 créditos' },
  { id: 'pack_300', credits: 300, label: '300 créditos' },
] as const;

export type CreditPackageId = (typeof CREDIT_PACKAGES)[number]['id'];

export function getCreditPackage(id: string) {
  return CREDIT_PACKAGES.find((p) => p.id === id) ?? null;
}

/** In-call gifts the client can send to the model (debited from client wallet). */
export const GIFT_CATALOG = [
  { id: 'rose', emoji: '🌹', label: 'Rosa', credits: 5 },
  { id: 'kiss', emoji: '💋', label: 'Beso', credits: 10 },
  { id: 'heart', emoji: '💖', label: 'Corazón', credits: 20 },
  { id: 'fire', emoji: '🔥', label: 'Fuego', credits: 35 },
  { id: 'diamond', emoji: '💎', label: 'Diamante', credits: 50 },
  { id: 'crown', emoji: '👑', label: 'Corona', credits: 100 },
] as const;

export type GiftId = (typeof GIFT_CATALOG)[number]['id'];

export function getGift(id: string) {
  return GIFT_CATALOG.find((g) => g.id === id) ?? null;
}
