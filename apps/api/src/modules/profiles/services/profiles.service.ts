import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, ProfileGender, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type {
  CompleteProfileDto,
  UpdatePayoutDto,
  UpdateSettingsDto,
} from '../dto/profile-setup.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'profiles', status: 'ok' };
  }

  async getMine(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    const gallery = await this.prisma.media.findMany({
      where: { userId, type: MediaType.GALLERY },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return { ...this.mapProfile(profile), gallery };
  }

  async completeProfile(userId: string, dto: CompleteProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user?.profile) throw new NotFoundException('Perfil no encontrado');

    const isModel = user.role === UserRole.MODEL;
    const galleryUrls = dto.galleryUrls ?? [];

    if (isModel) {
      if (galleryUrls.length < 1 || galleryUrls.length > 8) {
        throw new BadRequestException('Las modelos deben subir entre 1 y 8 fotos');
      }
    } else if (dto.avatarUrl == null && galleryUrls.length === 0 && !user.profile.avatarUrl) {
      throw new BadRequestException('Agrega una foto de perfil');
    }

    const avatarUrl = dto.avatarUrl ?? galleryUrls[0] ?? user.profile.avatarUrl ?? undefined;

    if (galleryUrls.length) {
      await this.prisma.media.deleteMany({ where: { userId, type: MediaType.GALLERY } });
      await this.prisma.media.createMany({
        data: galleryUrls.map((url, index) => ({
          userId,
          type: MediaType.GALLERY,
          url,
          key: `gallery/${userId}/${index}`,
          sortOrder: index,
        })),
      });
    }

    if (avatarUrl) {
      await this.prisma.media.deleteMany({ where: { userId, type: MediaType.AVATAR } });
      await this.prisma.media.create({
        data: {
          userId,
          type: MediaType.AVATAR,
          url: avatarUrl,
          key: `avatars/${userId}/main`,
          sortOrder: 0,
        },
      });
    }

    const profile = await this.prisma.profile.update({
      where: { userId },
      data: {
        bio: dto.bio?.trim() || user.profile.bio,
        tags: dto.tags ?? user.profile.tags,
        attributes: (dto.attributes ?? user.profile.attributes) as object | undefined,
        avatarUrl: avatarUrl ?? user.profile.avatarUrl,
        messagePrice: isModel ? (dto.messagePrice ?? user.profile.messagePrice) : user.profile.messagePrice,
        chatPricePerMin: isModel
          ? (dto.chatPricePerMin ?? user.profile.chatPricePerMin)
          : user.profile.chatPricePerMin,
        videoPricePerMin: isModel
          ? (dto.videoPricePerMin ?? user.profile.videoPricePerMin)
          : user.profile.videoPricePerMin,
        contentPrice: isModel
          ? (dto.contentPrice ?? user.profile.contentPrice)
          : user.profile.contentPrice,
        acceptsEncounters: isModel
          ? (dto.acceptsEncounters ?? user.profile.acceptsEncounters)
          : false,
        profileCompleted: dto.markCompleted === false ? user.profile.profileCompleted : true,
      },
    });

    return this.mapProfile(profile);
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');

    if (dto.galleryUrls) {
      if (dto.galleryUrls.length > 8) {
        throw new BadRequestException('Máximo 8 fotos en la galería');
      }
      await this.prisma.media.deleteMany({ where: { userId, type: MediaType.GALLERY } });
      if (dto.galleryUrls.length) {
        await this.prisma.media.createMany({
          data: dto.galleryUrls.map((url, index) => ({
            userId,
            type: MediaType.GALLERY,
            url,
            key: `gallery/${userId}/${index}`,
            sortOrder: index,
          })),
        });
      }
    }

    if (dto.avatarUrl) {
      await this.prisma.media.deleteMany({ where: { userId, type: MediaType.AVATAR } });
      await this.prisma.media.create({
        data: {
          userId,
          type: MediaType.AVATAR,
          url: dto.avatarUrl,
          key: `avatars/${userId}/main`,
          sortOrder: 0,
        },
      });
    }

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: {
        displayName: dto.displayName?.trim() || undefined,
        bio: dto.bio?.trim(),
        avatarUrl: dto.avatarUrl,
        tags: dto.tags,
        attributes: dto.attributes as object | undefined,
        messagePrice: dto.messagePrice,
        chatPricePerMin: dto.chatPricePerMin,
        videoPricePerMin: dto.videoPricePerMin,
        contentPrice: dto.contentPrice,
        acceptsEncounters: dto.acceptsEncounters,
      },
    });
    return this.mapProfile(updated);
  }

  async updatePayout(userId: string, dto: UpdatePayoutDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.MODEL) {
      throw new BadRequestException('Solo modelos pueden configurar cuenta bancaria');
    }

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: {
        payoutBankId: dto.payoutBankId,
        payoutAccountType: dto.payoutAccountType,
        payoutAccount: dto.payoutAccount.trim(),
        payoutHolder: dto.payoutHolder.trim(),
      },
    });
    return this.mapProfile(updated);
  }

  async listModels(
    viewerId: string | undefined,
    params: { gender?: string; filter?: string; q?: string },
  ) {
    const where: Record<string, unknown> = {
      user: { role: UserRole.MODEL, isActive: true },
      profileCompleted: true,
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

    let favoriteModelIds = new Set<string>();
    if (viewerId && params.filter === 'favorites') {
      const favs = await this.prisma.favorite.findMany({
        where: { clientId: viewerId },
        select: { modelId: true },
      });
      favoriteModelIds = new Set(favs.map((f) => f.modelId));
      if (favoriteModelIds.size === 0) {
        return [];
      }
      where.userId = { in: [...favoriteModelIds] };
    } else if (viewerId) {
      const favs = await this.prisma.favorite.findMany({
        where: { clientId: viewerId },
        select: { modelId: true },
      });
      favoriteModelIds = new Set(favs.map((f) => f.modelId));
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

    return profiles.map((p) => ({
      ...this.mapProfile(p),
      isFavorited: favoriteModelIds.has(p.userId),
    }));
  }

  async toggleFavorite(clientId: string, modelUserId: string) {
    const client = await this.prisma.user.findUnique({ where: { id: clientId } });
    if (!client || client.role !== UserRole.CLIENT) {
      throw new BadRequestException('Solo usuarios pueden guardar favoritos');
    }

    const model = await this.prisma.user.findUnique({
      where: { id: modelUserId },
      include: { profile: true },
    });
    if (!model || model.role !== UserRole.MODEL || !model.profile) {
      throw new NotFoundException('Modelo no encontrada');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: { clientId_modelId: { clientId, modelId: modelUserId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false, modelId: modelUserId };
    }

    await this.prisma.favorite.create({
      data: { clientId, modelId: modelUserId },
    });
    return { favorited: true, modelId: modelUserId };
  }

  async listFavorites(clientId: string) {
    const client = await this.prisma.user.findUnique({ where: { id: clientId } });
    if (!client || client.role !== UserRole.CLIENT) {
      throw new BadRequestException('Solo usuarios pueden ver favoritos');
    }

    const favs = await this.prisma.favorite.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        model: { include: { profile: true } },
      },
    });

    return favs
      .filter((f) => f.model.profile)
      .map((f) => ({
        ...this.mapProfile(f.model.profile!),
        isFavorited: true,
      }));
  }

  async listClients(
    requesterId: string,
    params: { gender?: string; filter?: string; q?: string },
  ) {
    const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
    if (!requester || requester.role !== UserRole.MODEL) {
      throw new BadRequestException('Solo modelos pueden ver la lista de usuarios');
    }

    const where: Record<string, unknown> = {
      user: { role: UserRole.CLIENT, isActive: true },
    };

    if (params.gender === 'FEMALE' || params.gender === 'MALE') {
      where.gender = params.gender as ProfileGender;
    }
    if (params.filter === 'online') {
      where.isOnline = true;
    }
    if (params.q?.trim()) {
      const q = params.q.trim();
      where.OR = [
        { displayName: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
      ];
    }

    const baseClientWhere = { user: { role: UserRole.CLIENT, isActive: true } };

    const [profiles, totalClients, onlineClients] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        orderBy: [{ isOnline: 'desc' as const }, { createdAt: 'desc' as const }],
        take: 60,
      }),
      this.prisma.profile.count({ where: baseClientWhere }),
      this.prisma.profile.count({
        where: { ...baseClientWhere, isOnline: true },
      }),
    ]);

    return {
      totalClients,
      onlineClients,
      clients: profiles.map((p) => ({
        id: p.id,
        userId: p.userId,
        displayName: p.displayName,
        username: p.username,
        avatarUrl: p.avatarUrl,
        bio: p.bio,
        gender: p.gender,
        age: p.age,
        isOnline: p.isOnline,
      })),
    };
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
    profileCompleted: boolean;
    rating: number;
    ratingCount: number;
    chatPricePerMin: number;
    videoPricePerMin: number;
    messagePrice: number;
    contentPrice: number;
    acceptsEncounters: boolean;
    tags: string[];
    gender: ProfileGender;
    age: number;
    attributes: unknown;
    services: unknown;
    payoutBankId: number | null;
    payoutAccountType: unknown;
    payoutAccount: string | null;
    payoutHolder: string | null;
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
      profileCompleted: p.profileCompleted,
      rating: p.rating,
      ratingCount: p.ratingCount,
      chatPricePerMin: p.chatPricePerMin,
      videoPricePerMin: p.videoPricePerMin,
      messagePrice: p.messagePrice,
      contentPrice: p.contentPrice,
      acceptsEncounters: p.acceptsEncounters,
      tags: p.tags,
      gender: p.gender,
      age: p.age,
      attributes: (p.attributes as Record<string, unknown> | null) ?? {},
      services: (p.services as Array<{ name: string; price: number; unit?: string }> | null) ?? [],
      payoutBankId: p.payoutBankId,
      payoutAccountType: p.payoutAccountType,
      payoutAccount: p.payoutAccount,
      payoutHolder: p.payoutHolder,
    };
  }
}
