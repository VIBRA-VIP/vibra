import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileGender, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'profiles', status: 'ok' };
  }

  async listModels(params: { gender?: string; filter?: string; q?: string }) {
    const where: Record<string, unknown> = {
      user: { role: UserRole.MODEL, isActive: true },
    };

    if (params.gender === 'FEMALE' || params.gender === 'MALE') {
      where.gender = params.gender as ProfileGender;
    }

    if (params.filter === 'online') {
      where.isOnline = true;
    }
    if (params.filter === 'available') {
      where.isAvailable = true;
    }

    if (params.q?.trim()) {
      const q = params.q.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    const orderBy =
      params.filter === 'popular'
        ? [{ rating: 'desc' as const }, { ratingCount: 'desc' as const }]
        : params.filter === 'new'
          ? [{ createdAt: 'desc' as const }]
          : [{ isOnline: 'desc' as const }, { rating: 'desc' as const }];

    const profiles = await this.prisma.profile.findMany({
      where,
      orderBy,
      take: 48,
    });

    return profiles.map((p) => this.mapProfile(p));
  }

  async getByUsername(username: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }
    return this.mapProfile(profile);
  }

  private mapProfile(p: {
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
    rating: number;
    ratingCount: number;
    chatPricePerMin: number;
    videoPricePerMin: number;
    tags: string[];
    gender: ProfileGender;
    age: number;
    attributes: unknown;
    services: unknown;
  }) {
    return {
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      username: p.username,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      bannerUrl: p.bannerUrl,
      isOnline: p.isOnline,
      isAvailable: p.isAvailable,
      isVerified: p.isVerified,
      rating: p.rating,
      ratingCount: p.ratingCount,
      chatPricePerMin: p.chatPricePerMin,
      videoPricePerMin: p.videoPricePerMin,
      tags: p.tags,
      gender: p.gender,
      age: p.age,
      attributes: (p.attributes as Record<string, unknown> | null) ?? {},
      services: (p.services as Array<{ name: string; price: number; unit?: string }> | null) ?? [],
    };
  }
}
