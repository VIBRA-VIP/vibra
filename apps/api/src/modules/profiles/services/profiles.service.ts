import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, ProfileGender, UserRole, VerificationStatus } from '@prisma/client';
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
      const idFront = dto.idDocumentUrl?.trim() || user.profile.idDocumentUrl;
      const idBack = dto.idDocumentBackUrl?.trim() || user.profile.idDocumentBackUrl;
      if (!idFront || !idBack) {
        throw new BadRequestException(
          'Sube el frente y el reverso de tu documento de identidad',
        );
      }
    } else if (dto.avatarUrl == null && galleryUrls.length === 0 && !user.profile.avatarUrl) {
      throw new BadRequestException('Agrega una foto de perfil');
    }

    const avatarUrl = dto.avatarUrl ?? galleryUrls[0] ?? user.profile.avatarUrl ?? undefined;
    const idDocumentUrl =
      isModel
        ? (dto.idDocumentUrl?.trim() || user.profile.idDocumentUrl || undefined)
        : undefined;
    const idDocumentBackUrl =
      isModel
        ? (dto.idDocumentBackUrl?.trim() || user.profile.idDocumentBackUrl || undefined)
        : undefined;

    let birthDate = user.profile.birthDate;
    let age = user.profile.age;
    if (dto.birthDate) {
      birthDate = parseBirthDate(dto.birthDate);
      age = ageFromBirthDate(birthDate);
      if (age < 18) {
        throw new BadRequestException('Debes ser mayor de 18 años');
      }
    }

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

    if (idDocumentUrl || idDocumentBackUrl) {
      await this.prisma.media.deleteMany({ where: { userId, type: MediaType.ID_DOCUMENT } });
      if (idDocumentUrl) {
        await this.prisma.media.create({
          data: {
            userId,
            type: MediaType.ID_DOCUMENT,
            url: idDocumentUrl,
            key: `id-documents/${userId}/front`,
            sortOrder: 0,
          },
        });
      }
      if (idDocumentBackUrl) {
        await this.prisma.media.create({
          data: {
            userId,
            type: MediaType.ID_DOCUMENT,
            url: idDocumentBackUrl,
            key: `id-documents/${userId}/back`,
            sortOrder: 1,
          },
        });
      }
    }

    const markingComplete = dto.markCompleted !== false;
    const profile = await this.prisma.profile.update({
      where: { userId },
      data: {
        bio: dto.bio?.trim() || user.profile.bio,
        tags: dto.tags ?? user.profile.tags,
        attributes: (dto.attributes ?? user.profile.attributes) as object | undefined,
        avatarUrl: avatarUrl ?? user.profile.avatarUrl,
        birthDate,
        age,
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
        profileCompleted: markingComplete ? true : user.profile.profileCompleted,
        ...(isModel && idDocumentUrl && idDocumentBackUrl
          ? {
              idDocumentUrl,
              idDocumentBackUrl,
              verificationStatus: VerificationStatus.PENDING,
              verificationSubmittedAt: new Date(),
              isVerified: false,
            }
          : {}),
      },
    });

    return this.mapProfile(profile);
  }

  async setIdDocument(userId: string, idDocumentUrl: string, idDocumentBackUrl: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user?.profile) throw new NotFoundException('Perfil no encontrado');
    if (user.role !== UserRole.MODEL) {
      throw new BadRequestException('Solo las modelos suben documento de identidad');
    }

    const front = idDocumentUrl.trim();
    const back = idDocumentBackUrl.trim();
    await this.prisma.media.deleteMany({ where: { userId, type: MediaType.ID_DOCUMENT } });
    await this.prisma.media.createMany({
      data: [
        {
          userId,
          type: MediaType.ID_DOCUMENT,
          url: front,
          key: `id-documents/${userId}/front`,
          sortOrder: 0,
        },
        {
          userId,
          type: MediaType.ID_DOCUMENT,
          url: back,
          key: `id-documents/${userId}/back`,
          sortOrder: 1,
        },
      ],
    });

    const profile = await this.prisma.profile.update({
      where: { userId },
      data: {
        idDocumentUrl: front,
        idDocumentBackUrl: back,
        verificationStatus: VerificationStatus.PENDING,
        verificationSubmittedAt: new Date(),
        isVerified: false,
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
    params: {
      gender?: string;
      filter?: string;
      q?: string;
      tag?: string;
      breastSize?: string;
      buttType?: string;
      bodyBuild?: string;
      penisSize?: string;
      skinTone?: string;
      hair?: string;
    },
  ) {
    const where: Record<string, unknown> = {
      user: { role: UserRole.MODEL, isActive: true },
      profileCompleted: true,
      verificationStatus: VerificationStatus.APPROVED,
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

    if (params.tag?.trim()) {
      where.tags = { has: params.tag.trim().toLowerCase() };
    }

    const attrFilters: Array<Record<string, unknown>> = [];
    const pushAttr = (path: string, value?: string) => {
      const v = value?.trim();
      if (!v) return;
      attrFilters.push({ path: [path], equals: v });
    };
    pushAttr('breastSize', params.breastSize);
    pushAttr('buttType', params.buttType);
    pushAttr('bodyBuild', params.bodyBuild);
    pushAttr('penisSize', params.penisSize);
    pushAttr('skinTone', params.skinTone);
    pushAttr('hair', params.hair);

    if (attrFilters.length === 1) {
      where.attributes = attrFilters[0];
    } else if (attrFilters.length > 1) {
      where.AND = attrFilters.map((f) => ({ attributes: f }));
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

    const useSmartRank =
      !params.filter || params.filter === 'all' || params.filter === 'online';

    const orderBy =
      params.filter === 'popular'
        ? [{ rating: 'desc' as const }, { ratingCount: 'desc' as const }]
        : params.filter === 'new'
          ? [{ createdAt: 'desc' as const }]
          : [{ isOnline: 'desc' as const }, { rating: 'desc' as const }];

    const profiles = await this.prisma.profile.findMany({
      where,
      orderBy: useSmartRank
        ? [{ isOnline: 'desc' as const }, { rating: 'desc' as const }]
        : orderBy,
      take: useSmartRank ? 120 : 48,
      include: useSmartRank
        ? {
            user: {
              select: {
                lastSeenAt: true,
                _count: { select: { posts: true } },
                posts: {
                  select: { createdAt: true },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          }
        : undefined,
    });

    if (!useSmartRank) {
      return profiles.map((p) => ({
        ...this.mapProfile(p),
        isFavorited: favoriteModelIds.has(p.userId),
      }));
    }

    type Ranked = (typeof profiles)[number] & {
      user?: {
        lastSeenAt: Date | null;
        _count: { posts: number };
        posts: { createdAt: Date }[];
      };
    };

    const ranked = [...(profiles as Ranked[])].sort((a, b) => {
      const score = (p: Ranked) => {
        const following = favoriteModelIds.has(p.userId);
        const postCount = p.user?._count.posts ?? 0;
        const hasPosts = postCount > 0;
        // Lower = higher priority
        if (following && hasPosts && p.isOnline) return 0;
        if (following && hasPosts) return 1;
        if (following && p.isOnline) return 2;
        if (following) return 3;
        if (hasPosts && p.isOnline) return 4;
        if (hasPosts) return 5;
        if (p.isOnline) return 6;
        return 7;
      };

      const sa = score(a);
      const sb = score(b);
      if (sa !== sb) return sa - sb;

      const lastPostA = a.user?.posts[0]?.createdAt?.getTime() ?? 0;
      const lastPostB = b.user?.posts[0]?.createdAt?.getTime() ?? 0;
      if (lastPostA !== lastPostB) return lastPostB - lastPostA;

      if (a.rating !== b.rating) return b.rating - a.rating;
      if (a.ratingCount !== b.ratingCount) return b.ratingCount - a.ratingCount;

      const seenA = a.user?.lastSeenAt?.getTime() ?? 0;
      const seenB = b.user?.lastSeenAt?.getTime() ?? 0;
      return seenB - seenA;
    });

    return ranked.slice(0, 48).map((p) => ({
      ...this.mapProfile(p),
      isFavorited: favoriteModelIds.has(p.userId),
      hasPosts: (p.user?._count.posts ?? 0) > 0,
      postCount: p.user?._count.posts ?? 0,
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

  async getByUsername(username: string, viewerId?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }
    const mapped = this.mapProfile(profile);
    if (!viewerId) return mapped;

    const fav = await this.prisma.favorite.findUnique({
      where: {
        clientId_modelId: { clientId: viewerId, modelId: profile.userId },
      },
    });
    return { ...mapped, isFavorited: Boolean(fav) };
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

function parseBirthDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new BadRequestException('Fecha de nacimiento inválida');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException('Fecha de nacimiento inválida');
  }
  if (date.getTime() > Date.now()) {
    throw new BadRequestException('La fecha de nacimiento no puede ser futura');
  }
  return date;
}

function ageFromBirthDate(birthDate: Date): number {
  const now = new Date();
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return age;
}
