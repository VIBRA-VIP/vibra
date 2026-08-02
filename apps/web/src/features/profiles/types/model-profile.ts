export interface ModelService {
  name: string;
  price: number;
  unit?: string;
}

export interface ModelProfile {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isOnline: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  isFavorited?: boolean;
  hasPosts?: boolean;
  postCount?: number;
  rating: number;
  ratingCount: number;
  chatPricePerMin: number;
  videoPricePerMin: number;
  contentPrice?: number;
  tags: string[];
  gender: 'FEMALE' | 'MALE' | 'OTHER';
  age: number;
  attributes: Record<string, string | boolean | number>;
  services: ModelService[];
}
