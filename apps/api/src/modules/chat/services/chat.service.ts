import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RealtimeGateway } from '../gateways/chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  health() {
    return { module: 'chat', status: 'ok' };
  }

  async openWith(userId: string, peerUserId: string) {
    if (!peerUserId || peerUserId === userId) {
      throw new BadRequestException('No puedes chatear contigo mismo');
    }

    const peer = await this.prisma.user.findUnique({
      where: { id: peerUserId },
      include: { profile: true },
    });
    if (!peer?.isActive || !peer.profile) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const conversation = await this.getOrCreateDm(userId, peerUserId);
    return this.mapConversation(conversation, userId);
  }

  async listConversations(userId: string) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    const ids = memberships.map((m) => m.conversationId);
    if (!ids.length) return [];

    const conversations = await this.prisma.conversation.findMany({
      where: { id: { in: ids } },
      include: {
        members: {
          include: { user: { include: { profile: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    });

    return conversations.map((c) => this.mapConversation(c, userId));
  }

  async listMessages(userId: string, conversationId: string) {
    await this.assertMember(userId, conversationId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    await this.prisma.conversationMember.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });

    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      type: m.type,
      createdAt: m.createdAt.toISOString(),
      fromMe: m.senderId === userId,
    }));
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const text = content?.trim();
    if (!text) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }
    if (text.length > 2000) {
      throw new BadRequestException('Mensaje demasiado largo');
    }

    await this.assertMember(userId, conversationId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        type: MessageType.TEXT,
        content: text,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    const payload = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt.toISOString(),
    };

    const members = await this.prisma.conversationMember.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    this.realtime.emitToUsers(
      members.map((m) => m.userId),
      'chat:message',
      { ...payload, conversationId },
    );

    return {
      ...payload,
      fromMe: true,
    };
  }

  private async assertMember(userId: string, conversationId: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });
    if (!member) {
      throw new ForbiddenException('No eres parte de esta conversación');
    }
  }

  private async getOrCreateDm(userId: string, peerUserId: string) {
    const myMemberships = await this.prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    const myIds = myMemberships.map((m) => m.conversationId);

    if (myIds.length) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          id: { in: myIds },
          members: { some: { userId: peerUserId } },
        },
        include: {
          members: {
            include: { user: { include: { profile: true } } },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (existing && existing.members.length === 2) {
        return existing;
      }
    }

    return this.prisma.conversation.create({
      data: {
        members: {
          create: [{ userId }, { userId: peerUserId }],
        },
      },
      include: {
        members: {
          include: { user: { include: { profile: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  private mapConversation(
    conversation: {
      id: string;
      lastMessageAt: Date | null;
      updatedAt: Date;
      members: Array<{
        userId: string;
        user: {
          id: string;
          profile: {
            displayName: string;
            username: string;
            avatarUrl: string | null;
            isOnline: boolean;
          } | null;
        };
      }>;
      messages: Array<{
        id: string;
        content: string;
        senderId: string;
        createdAt: Date;
      }>;
    },
    viewerId: string,
  ) {
    const peerMember = conversation.members.find((m) => m.userId !== viewerId);
    const peerProfile = peerMember?.user.profile;
    const last = conversation.messages[0];

    return {
      id: conversation.id,
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
      updatedAt: conversation.updatedAt.toISOString(),
      peer: peerMember
        ? {
            userId: peerMember.userId,
            displayName: peerProfile?.displayName ?? 'Usuario',
            username: peerProfile?.username ?? 'user',
            avatarUrl: peerProfile?.avatarUrl ?? null,
            isOnline: peerProfile?.isOnline ?? false,
          }
        : null,
      lastMessage: last
        ? {
            id: last.id,
            content: last.content,
            senderId: last.senderId,
            createdAt: last.createdAt.toISOString(),
            fromMe: last.senderId === viewerId,
          }
        : null,
    };
  }
}
