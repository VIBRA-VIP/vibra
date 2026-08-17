import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { UserRole, VideoCallStatus } from '@prisma/client';
import type { Env } from '../../../config/env.schema';
import {
  generateVideoRoomName,
  MIN_VIDEO_CALL_MINUTES,
  VIDEO_CALL_EXTEND_OPTIONS,
  videoCallExtendCredits,
  videoCallPrepaidCredits,
} from '@vibra/shared';
import { GIFT_CATALOG, getGift } from '@vibra/types';
import { PrismaService } from '../../../database/prisma.service';
import { RealtimeGateway } from '../../chat/gateways/chat.gateway';

type CallWithPeers = {
  id: string;
  clientId: string;
  modelId: string;
  roomName: string;
  status: VideoCallStatus;
  pricePerMin: number;
  creditsSpent: number;
  extraMinutes: number;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  client: {
    id: string;
    profile: { displayName: string; username: string; avatarUrl: string | null } | null;
  };
  model: {
    id: string;
    profile: { displayName: string; username: string; avatarUrl: string | null } | null;
  };
};

@Injectable()
export class VideoCallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly config: ConfigService<Env, true>,
  ) {}

  health() {
    return { module: 'video-call', status: 'ok' };
  }

  /**
   * ICE servers for the browser. Always includes public STUN; adds TURN with
   * time-limited REST credentials (coturn `use-auth-secret`) when configured.
   */
  iceConfig() {
    const iceServers: {
      urls: string | string[];
      username?: string;
      credential?: string;
    }[] = [
      {
        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
      },
    ];

    const secret = this.config.get('TURN_SECRET', { infer: true });
    const urlsRaw = this.config.get('TURN_URLS', { infer: true });
    if (secret && urlsRaw) {
      const ttlSeconds = 3600;
      const username = `${Math.floor(Date.now() / 1000) + ttlSeconds}`;
      const credential = createHmac('sha1', secret)
        .update(username)
        .digest('base64');
      const urls = urlsRaw
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
      iceServers.push({ urls, username, credential });
    }

    return { iceServers };
  }

  listGifts() {
    return GIFT_CATALOG.map((g) => ({
      id: g.id,
      emoji: g.emoji,
      label: g.label,
      credits: g.credits,
    }));
  }

  async sendGift(userId: string, callId: string, giftId: string) {
    const gift = getGift(giftId);
    if (!gift) throw new BadRequestException('Regalo inválido');

    const call = await this.findCallOrThrow(callId);
    this.assertParticipant(userId, call);
    if (call.status !== VideoCallStatus.ACTIVE) {
      throw new BadRequestException('La llamada no está activa');
    }
    if (call.clientId !== userId) {
      throw new ForbiddenException('Solo el cliente puede enviar regalos');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let clientWallet = await tx.wallet.findUnique({ where: { userId: call.clientId } });
      if (!clientWallet) {
        clientWallet = await tx.wallet.create({ data: { userId: call.clientId } });
      }
      if (clientWallet.balance < gift.credits) {
        throw new BadRequestException(
          `Saldo insuficiente. Necesitas ${gift.credits} créditos`,
        );
      }

      const clientAfter = clientWallet.balance - gift.credits;
      await tx.wallet.update({
        where: { id: clientWallet.id },
        data: { balance: clientAfter },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: clientWallet.id,
          userId: call.clientId,
          type: 'GIFT',
          amount: -gift.credits,
          balanceAfter: clientAfter,
          description: `Regalo ${gift.emoji} ${gift.label} (${gift.credits} créd)`,
          referenceId: call.id,
        },
      });

      let modelWallet = await tx.wallet.findUnique({ where: { userId: call.modelId } });
      if (!modelWallet) {
        modelWallet = await tx.wallet.create({ data: { userId: call.modelId } });
      }
      const modelAfter = modelWallet.balance + gift.credits;
      await tx.wallet.update({
        where: { id: modelWallet.id },
        data: { balance: modelAfter },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: modelWallet.id,
          userId: call.modelId,
          type: 'GIFT',
          amount: gift.credits,
          balanceAfter: modelAfter,
          description: `Regalo recibido ${gift.emoji} ${gift.label}`,
          referenceId: call.id,
        },
      });

      const updated = await tx.videoCall.update({
        where: { id: call.id },
        data: { creditsSpent: { increment: gift.credits } },
        include: this.peersInclude(),
      });

      return { call: updated, clientBalance: clientAfter, modelBalance: modelAfter };
    });

    const payload = {
      callId: call.id,
      gift: {
        id: gift.id,
        emoji: gift.emoji,
        label: gift.label,
        credits: gift.credits,
      },
      from: {
        userId: call.client.id,
        displayName: call.client.profile?.displayName ?? 'Cliente',
      },
      to: {
        userId: call.model.id,
        displayName: call.model.profile?.displayName ?? 'Modelo',
      },
      clientBalance: result.clientBalance,
      modelBalance: result.modelBalance,
      createdAt: new Date().toISOString(),
    };

    this.realtime.emitToUser(call.clientId, 'video-call:gift', payload);
    this.realtime.emitToUser(call.modelId, 'video-call:gift', payload);
    return payload;
  }

  async create(clientId: string, modelId: string) {
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      include: { wallet: true, profile: true },
    });
    if (!client || client.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Solo los clientes pueden solicitar videollamadas');
    }

    if (clientId === modelId) {
      throw new BadRequestException('No puedes llamarte a ti mismo');
    }

    const model = await this.prisma.user.findUnique({
      where: { id: modelId },
      include: { profile: true },
    });
    if (!model || model.role !== UserRole.MODEL || !model.profile) {
      throw new NotFoundException('Modelo no encontrada');
    }

    const pricePerMin = model.profile.videoPricePerMin;
    const totalCredits = videoCallPrepaidCredits(pricePerMin);
    const balance = client.wallet?.balance ?? 0;
    if (balance < totalCredits) {
      throw new BadRequestException(
        `Necesitas al menos ${totalCredits} créditos (${MIN_VIDEO_CALL_MINUTES} min × ${pricePerMin}). Saldo: ${balance}`,
      );
    }

    const activeOrPending = await this.prisma.videoCall.findFirst({
      where: {
        OR: [
          { clientId, status: { in: [VideoCallStatus.PENDING, VideoCallStatus.ACTIVE] } },
          { modelId, status: { in: [VideoCallStatus.PENDING, VideoCallStatus.ACTIVE] } },
        ],
      },
    });
    if (activeOrPending) {
      throw new BadRequestException('Ya hay una videollamada pendiente o activa');
    }

    const id = crypto.randomUUID();
    const roomName = generateVideoRoomName(id.replace(/-/g, '').slice(0, 16));

    const call = await this.prisma.videoCall.create({
      data: {
        id,
        clientId,
        modelId,
        roomName,
        status: VideoCallStatus.PENDING,
        pricePerMin,
      },
      include: this.peersInclude(),
    });

    const payload = this.serialize(call);
    this.realtime.emitToUser(modelId, 'video-call:incoming', payload);
    return payload;
  }

  async listPending(modelId: string) {
    const model = await this.prisma.user.findUnique({ where: { id: modelId } });
    if (!model || model.role !== UserRole.MODEL) {
      throw new ForbiddenException('Solo las modelos pueden ver la cola');
    }

    const calls = await this.prisma.videoCall.findMany({
      where: { modelId, status: VideoCallStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: this.peersInclude(),
    });

    return calls.map((c) => this.serialize(c));
  }

  async getOne(userId: string, callId: string) {
    const call = await this.findCallOrThrow(callId);
    this.assertParticipant(userId, call);
    return this.serialize(call);
  }

  async accept(modelId: string, callId: string) {
    const existing = await this.findCallOrThrow(callId);
    if (existing.modelId !== modelId) {
      throw new ForbiddenException('No puedes aceptar esta llamada');
    }
    if (existing.status !== VideoCallStatus.PENDING) {
      throw new BadRequestException(`La llamada está en estado ${existing.status}`);
    }

    const totalCredits = videoCallPrepaidCredits(existing.pricePerMin);

    const call = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.videoCall.findUnique({ where: { id: callId } });
      if (!locked || locked.status !== VideoCallStatus.PENDING) {
        throw new BadRequestException('La llamada ya no está pendiente');
      }

      let wallet = await tx.wallet.findUnique({ where: { userId: locked.clientId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId: locked.clientId } });
      }
      if (wallet.balance < totalCredits) {
        throw new BadRequestException(
          `El cliente no tiene créditos suficientes (${totalCredits} requeridos)`,
        );
      }

      const balanceAfter = wallet.balance - totalCredits;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          userId: locked.clientId,
          type: 'VIDEO_CALL',
          amount: -totalCredits,
          balanceAfter,
          description: `Videollamada ${MIN_VIDEO_CALL_MINUTES} min (${locked.pricePerMin} créd/min)`,
          referenceId: locked.id,
        },
      });

      let modelWallet = await tx.wallet.findUnique({ where: { userId: locked.modelId } });
      if (!modelWallet) {
        modelWallet = await tx.wallet.create({ data: { userId: locked.modelId } });
      }
      const modelAfter = modelWallet.balance + totalCredits;
      await tx.wallet.update({
        where: { id: modelWallet.id },
        data: { balance: modelAfter },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: modelWallet.id,
          userId: locked.modelId,
          type: 'VIDEO_CALL',
          amount: totalCredits,
          balanceAfter: modelAfter,
          description: `Ingreso videollamada ${MIN_VIDEO_CALL_MINUTES} min`,
          referenceId: locked.id,
        },
      });

      return tx.videoCall.update({
        where: { id: callId },
        data: {
          status: VideoCallStatus.ACTIVE,
          startedAt: new Date(),
          creditsSpent: totalCredits,
        },
        include: this.peersInclude(),
      });
    });

    const payload = this.serialize(call);
    this.realtime.emitToUser(call.clientId, 'video-call:accepted', payload);
    this.realtime.emitToUser(call.modelId, 'video-call:accepted', payload);
    return payload;
  }

  async decline(modelId: string, callId: string) {
    const existing = await this.findCallOrThrow(callId);
    if (existing.modelId !== modelId) {
      throw new ForbiddenException('No puedes rechazar esta llamada');
    }
    if (existing.status !== VideoCallStatus.PENDING) {
      throw new BadRequestException(`La llamada está en estado ${existing.status}`);
    }

    const call = await this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: VideoCallStatus.CANCELLED,
        endedAt: new Date(),
      },
      include: this.peersInclude(),
    });

    const payload = this.serialize(call);
    this.realtime.emitToUser(call.clientId, 'video-call:ended', payload);
    this.realtime.emitToUser(call.modelId, 'video-call:ended', payload);
    return payload;
  }

  async extend(userId: string, callId: string, minutes: number) {
    if (!VIDEO_CALL_EXTEND_OPTIONS.includes(minutes as (typeof VIDEO_CALL_EXTEND_OPTIONS)[number])) {
      throw new BadRequestException(
        `Solo puedes agregar ${VIDEO_CALL_EXTEND_OPTIONS.join(', ')} minutos`,
      );
    }

    const existing = await this.findCallOrThrow(callId);
    this.assertParticipant(userId, existing);
    if (existing.status !== VideoCallStatus.ACTIVE) {
      throw new BadRequestException('La llamada no está activa');
    }
    if (existing.clientId !== userId) {
      throw new ForbiddenException('Solo el cliente puede extender la llamada');
    }

    const credits = videoCallExtendCredits(existing.pricePerMin, minutes);

    const result = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.videoCall.findUnique({ where: { id: callId } });
      if (!locked || locked.status !== VideoCallStatus.ACTIVE) {
        throw new BadRequestException('La llamada ya terminó');
      }

      let clientWallet = await tx.wallet.findUnique({ where: { userId: locked.clientId } });
      if (!clientWallet) {
        clientWallet = await tx.wallet.create({ data: { userId: locked.clientId } });
      }
      if (clientWallet.balance < credits) {
        throw new BadRequestException(
          `Saldo insuficiente. Necesitas ${credits} créditos para ${minutes} min`,
        );
      }

      const clientAfter = clientWallet.balance - credits;
      await tx.wallet.update({
        where: { id: clientWallet.id },
        data: { balance: clientAfter },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: clientWallet.id,
          userId: locked.clientId,
          type: 'VIDEO_CALL',
          amount: -credits,
          balanceAfter: clientAfter,
          description: `Videollamada +${minutes} min (${locked.pricePerMin} créd/min)`,
          referenceId: locked.id,
        },
      });

      let modelWallet = await tx.wallet.findUnique({ where: { userId: locked.modelId } });
      if (!modelWallet) {
        modelWallet = await tx.wallet.create({ data: { userId: locked.modelId } });
      }
      const modelAfter = modelWallet.balance + credits;
      await tx.wallet.update({
        where: { id: modelWallet.id },
        data: { balance: modelAfter },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: modelWallet.id,
          userId: locked.modelId,
          type: 'VIDEO_CALL',
          amount: credits,
          balanceAfter: modelAfter,
          description: `Ingreso videollamada +${minutes} min`,
          referenceId: locked.id,
        },
      });

      const updated = await tx.videoCall.update({
        where: { id: callId },
        data: {
          extraMinutes: { increment: minutes },
          creditsSpent: { increment: credits },
        },
        include: this.peersInclude(),
      });

      return { call: updated, clientBalance: clientAfter, modelBalance: modelAfter };
    });

    const payload = {
      ...this.serialize(result.call),
      addedMinutes: minutes,
      addedCredits: credits,
      clientBalance: result.clientBalance,
      modelBalance: result.modelBalance,
    };

    this.realtime.emitToUser(result.call.clientId, 'video-call:extended', payload);
    this.realtime.emitToUser(result.call.modelId, 'video-call:extended', payload);
    return payload;
  }

  async end(userId: string, callId: string) {
    const existing = await this.findCallOrThrow(callId);
    this.assertParticipant(userId, existing);

    if (
      existing.status === VideoCallStatus.ENDED ||
      existing.status === VideoCallStatus.CANCELLED
    ) {
      return this.serialize(existing);
    }

    const nextStatus =
      existing.status === VideoCallStatus.PENDING
        ? VideoCallStatus.CANCELLED
        : VideoCallStatus.ENDED;

    const call = await this.prisma.videoCall.update({
      where: { id: callId },
      data: {
        status: nextStatus,
        endedAt: new Date(),
      },
      include: this.peersInclude(),
    });

    const payload = this.serialize(call);
    this.realtime.emitToUser(call.clientId, 'video-call:ended', payload);
    this.realtime.emitToUser(call.modelId, 'video-call:ended', payload);
    return payload;
  }

  private peersInclude() {
    return {
      client: {
        select: {
          id: true,
          profile: { select: { displayName: true, username: true, avatarUrl: true } },
        },
      },
      model: {
        select: {
          id: true,
          profile: { select: { displayName: true, username: true, avatarUrl: true } },
        },
      },
    } as const;
  }

  private async findCallOrThrow(callId: string): Promise<CallWithPeers> {
    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
      include: this.peersInclude(),
    });
    if (!call) throw new NotFoundException('Videollamada no encontrada');
    return call;
  }

  private assertParticipant(userId: string, call: { clientId: string; modelId: string }) {
    if (call.clientId !== userId && call.modelId !== userId) {
      throw new ForbiddenException('No eres participante de esta llamada');
    }
  }

  private serialize(call: CallWithPeers) {
    const totalCredits = videoCallPrepaidCredits(call.pricePerMin);
    const paidMinutes = MIN_VIDEO_CALL_MINUTES + call.extraMinutes;
    const endsAt =
      call.startedAt != null
        ? new Date(call.startedAt.getTime() + paidMinutes * 60_000).toISOString()
        : null;

    return {
      id: call.id,
      status: call.status,
      roomName: call.roomName,
      pricePerMin: call.pricePerMin,
      prepaidMinutes: paidMinutes,
      extraMinutes: call.extraMinutes,
      extendOptions: [...VIDEO_CALL_EXTEND_OPTIONS],
      totalCredits,
      creditsSpent: call.creditsSpent,
      startedAt: call.startedAt?.toISOString() ?? null,
      endedAt: call.endedAt?.toISOString() ?? null,
      endsAt,
      createdAt: call.createdAt.toISOString(),
      waitedSeconds: Math.max(
        0,
        Math.floor((Date.now() - call.createdAt.getTime()) / 1000),
      ),
      client: {
        userId: call.client.id,
        displayName: call.client.profile?.displayName ?? 'Cliente',
        username: call.client.profile?.username ?? '',
        avatarUrl: call.client.profile?.avatarUrl ?? null,
      },
      model: {
        userId: call.model.id,
        displayName: call.model.profile?.displayName ?? 'Modelo',
        username: call.model.profile?.username ?? '',
        avatarUrl: call.model.profile?.avatarUrl ?? null,
      },
    };
  }
}
