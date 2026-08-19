import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostVisibility, UserRole, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type { CreateCommentDto, CreatePostDto } from '../dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { module: 'posts', status: 'ok' };
  }

  async create(authorId: string, dto: CreatePostDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: authorId },
      include: { profile: true },
    });
    if (!user || user.role !== UserRole.MODEL) {
      throw new ForbiddenException('Solo modelos pueden publicar');
    }
    if (user.profile?.verificationStatus !== VerificationStatus.APPROVED) {
      throw new ForbiddenException('Debes estar verificada para publicar');
    }

    const images = dto.media.filter((m) => m.kind === 'IMAGE');
    const videos = dto.media.filter((m) => m.kind === 'VIDEO');
    if (dto.media.length < 1) {
      throw new BadRequestException('Agrega al menos 1 foto o video');
    }
    if (dto.media.length > 5) {
      throw new BadRequestException('Máximo 5 archivos por publicación');
    }
    if (images.length + videos.length !== dto.media.length) {
      throw new BadRequestException('Tipo de medio inválido');
    }

    const priceCredits =
      dto.visibility === PostVisibility.PAID
        ? (dto.priceCredits ?? user.profile.contentPrice ?? 100)
        : null;

    const post = await this.prisma.post.create({
      data: {
        authorId,
        text: (dto.text ?? '').trim(),
        visibility: dto.visibility,
        priceCredits,
        media: {
          create: dto.media.map((m, index) => ({
            url: m.url,
            kind: m.kind,
            sortOrder: index,
          })),
        },
      },
      include: this.postInclude(authorId),
    });

    return this.mapPost(post, authorId, false);
  }

  async listFeed(viewerId: string, take = 30) {
    const limit = Math.min(take, 50);
    const posts = await this.prisma.post.findMany({
      where: {
        author: {
          role: UserRole.MODEL,
          isActive: true,
          profile: {
            profileCompleted: true,
            verificationStatus: VerificationStatus.APPROVED,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit * 2, 80),
      include: this.postInclude(viewerId),
    });

    const following = await this.favoriteSet(
      viewerId,
      posts.map((p) => p.authorId),
    );

    const ranked = [...posts].sort((a, b) => {
      const fa = following.has(a.authorId) ? 0 : 1;
      const fb = following.has(b.authorId) ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Mix: keep followed-first, but weave in a discovery post every ~3 followed posts
    // so the feed stays fresh and entertaining.
    const followed = ranked.filter((p) => following.has(p.authorId));
    const discover = ranked.filter((p) => !following.has(p.authorId));
    const mixed: typeof ranked = [];
    let fi = 0;
    let di = 0;
    while (mixed.length < limit && (fi < followed.length || di < discover.length)) {
      for (let n = 0; n < 3 && fi < followed.length && mixed.length < limit; n += 1) {
        mixed.push(followed[fi]!);
        fi += 1;
      }
      if (di < discover.length && mixed.length < limit) {
        mixed.push(discover[di]!);
        di += 1;
      }
      if (fi >= followed.length) {
        while (di < discover.length && mixed.length < limit) {
          mixed.push(discover[di]!);
          di += 1;
        }
      }
      if (di >= discover.length) {
        while (fi < followed.length && mixed.length < limit) {
          mixed.push(followed[fi]!);
          fi += 1;
        }
      }
    }

    return mixed.map((p) => this.mapPost(p, viewerId, following.has(p.authorId)));
  }

  async listByAuthor(authorId: string, viewerId: string, take = 40) {
    const posts = await this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take, 50),
      include: this.postInclude(viewerId),
    });
    const following = await this.favoriteSet(viewerId, [authorId]);
    const isFollowing = following.has(authorId);
    return posts.map((p) => this.mapPost(p, viewerId, isFollowing));
  }

  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Publicación no encontrada');

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { id: existing.id } });
      const likesCount = await this.prisma.postLike.count({ where: { postId } });
      return { liked: false, likesCount };
    }

    await this.prisma.postLike.create({ data: { postId, userId } });
    const likesCount = await this.prisma.postLike.count({ where: { postId } });
    return { liked: true, likesCount };
  }

  async listComments(postId: string, take = 50) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Publicación no encontrada');

    const comments = await this.prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      take: Math.min(take, 100),
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: { displayName: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      author: {
        userId: c.user.id,
        displayName: c.user.profile?.displayName ?? 'Usuario',
        username: c.user.profile?.username ?? 'user',
        avatarUrl: c.user.profile?.avatarUrl ?? null,
      },
    }));
  }

  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    const text = dto.text.trim();
    if (!text) throw new BadRequestException('Escribe un comentario');

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Publicación no encontrada');

    const comment = await this.prisma.postComment.create({
      data: { postId, userId, text },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: { displayName: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return {
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      author: {
        userId: comment.user.id,
        displayName: comment.user.profile?.displayName ?? 'Usuario',
        username: comment.user.profile?.username ?? 'user',
        avatarUrl: comment.user.profile?.avatarUrl ?? null,
      },
    };
  }

  private postInclude(viewerId: string) {
    return {
      author: {
        select: {
          id: true,
          profile: {
            select: {
              displayName: true,
              username: true,
              avatarUrl: true,
              isVerified: true,
              contentPrice: true,
            },
          },
        },
      },
      media: { orderBy: { sortOrder: 'asc' as const } },
      _count: { select: { likes: true, comments: true } },
      likes: {
        where: { userId: viewerId },
        select: { id: true },
        take: 1,
      },
      unlocks: {
        where: { userId: viewerId },
        select: { id: true },
        take: 1,
      },
    };
  }

  private async favoriteSet(clientId: string, modelIds: string[]) {
    if (!modelIds.length) return new Set<string>();
    const rows = await this.prisma.favorite.findMany({
      where: { clientId, modelId: { in: modelIds } },
      select: { modelId: true },
    });
    return new Set(rows.map((r) => r.modelId));
  }

  private mapPost(
    post: {
      id: string;
      authorId: string;
      text: string;
      visibility: PostVisibility;
      priceCredits: number | null;
      createdAt: Date;
      author: {
        id: string;
        profile: {
          displayName: string;
          username: string;
          avatarUrl: string | null;
          isVerified: boolean;
          contentPrice: number;
        } | null;
      };
      media: { id: string; url: string; kind: 'IMAGE' | 'VIDEO'; sortOrder: number }[];
      _count: { likes: number; comments: number };
      likes: { id: string }[];
      unlocks?: { id: string }[];
    },
    viewerId: string,
    isFollowing: boolean,
  ) {
    const isOwner = post.authorId === viewerId;
    const isPaid = post.visibility === PostVisibility.PAID;
    const unlocked = isOwner || (post.unlocks?.length ?? 0) > 0;
    const locked = isPaid && !unlocked;
    const price = post.priceCredits ?? post.author.profile?.contentPrice ?? 100;

    return {
      id: post.id,
      text: post.text,
      visibility: post.visibility,
      priceCredits: isPaid ? price : null,
      locked,
      createdAt: post.createdAt.toISOString(),
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      likedByMe: post.likes.length > 0,
      isFollowing,
      author: {
        userId: post.author.id,
        displayName: post.author.profile?.displayName ?? 'Modelo',
        username: post.author.profile?.username ?? 'modelo',
        avatarUrl: post.author.profile?.avatarUrl ?? null,
        isVerified: Boolean(post.author.profile?.isVerified),
      },
      media: post.media.map((m) => ({
        id: m.id,
        kind: m.kind,
        url: locked ? '' : m.url,
        sortOrder: m.sortOrder,
      })),
    };
  }

  async unlock(userId: string, postId: string) {
    const existing = await this.prisma.post.findUnique({
      where: { id: postId },
      include: this.postInclude(userId),
    });
    if (!existing) throw new NotFoundException('Publicación no encontrada');

    const following = await this.favoriteSet(userId, [existing.authorId]);
    const isFollowing = following.has(existing.authorId);

    if (existing.authorId === userId || existing.visibility !== PostVisibility.PAID) {
      return {
        post: this.mapPost(existing, userId, isFollowing),
        clientBalance: null as number | null,
      };
    }

    if ((existing.unlocks?.length ?? 0) > 0) {
      return {
        post: this.mapPost(existing, userId, isFollowing),
        clientBalance: null as number | null,
      };
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!buyer || buyer.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Solo los clientes pueden desbloquear contenido de pago');
    }

    const price = Math.max(
      1,
      existing.priceCredits ?? existing.author.profile?.contentPrice ?? 100,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const already = await tx.postUnlock.findUnique({
        where: { postId_userId: { postId, userId } },
      });
      if (already) {
        return { clientAfter: null as number | null };
      }

      let clientWallet = await tx.wallet.findUnique({ where: { userId } });
      if (!clientWallet) {
        clientWallet = await tx.wallet.create({ data: { userId } });
      }
      if (clientWallet.balance < price) {
        throw new BadRequestException(
          `Saldo insuficiente. Necesitas ${price} créditos. Saldo: ${clientWallet.balance}`,
        );
      }

      const clientAfter = clientWallet.balance - price;
      await tx.wallet.update({
        where: { id: clientWallet.id },
        data: { balance: clientAfter },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: clientWallet.id,
          userId,
          type: 'POST_UNLOCK',
          amount: -price,
          balanceAfter: clientAfter,
          description: `Desbloqueo publicación (${price} créd)`,
          referenceId: postId,
        },
      });

      let modelWallet = await tx.wallet.findUnique({
        where: { userId: existing.authorId },
      });
      if (!modelWallet) {
        modelWallet = await tx.wallet.create({ data: { userId: existing.authorId } });
      }
      const modelAfter = modelWallet.balance + price;
      await tx.wallet.update({
        where: { id: modelWallet.id },
        data: { balance: modelAfter },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: modelWallet.id,
          userId: existing.authorId,
          type: 'POST_UNLOCK',
          amount: price,
          balanceAfter: modelAfter,
          description: `Ingreso contenido de pago (${price} créd)`,
          referenceId: postId,
        },
      });

      await tx.postUnlock.create({
        data: { postId, userId, creditsPaid: price },
      });

      return { clientAfter };
    });

    const unlocked = await this.prisma.post.findUnique({
      where: { id: postId },
      include: this.postInclude(userId),
    });
    if (!unlocked) throw new NotFoundException('Publicación no encontrada');

    return {
      post: this.mapPost(unlocked, userId, isFollowing),
      clientBalance: result.clientAfter,
    };
  }
}
