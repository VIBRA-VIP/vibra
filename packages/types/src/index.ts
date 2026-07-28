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
  { id: 'pack_100', credits: 100, priceLabel: '100 créditos' },
  { id: 'pack_500', credits: 500, priceLabel: '500 créditos' },
  { id: 'pack_1000', credits: 1000, priceLabel: '1000 créditos' },
  { id: 'pack_2500', credits: 2500, priceLabel: '2500 créditos' },
] as const;
