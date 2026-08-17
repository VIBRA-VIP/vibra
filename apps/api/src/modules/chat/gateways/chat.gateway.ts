import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { VideoCallStatus } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../../database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: (process.env.WEB_URL ?? 'http://localhost:5173')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (typeof client.handshake.headers.authorization === 'string'
          ? client.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
          : undefined);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      const userId = payload.sub;
      if (!userId) {
        client.disconnect();
        return;
      }
      client.data.userId = userId;
      await client.join(`user:${userId}`);
      this.logger.debug(`Client connected: ${client.id} user=${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToUsers(userIds: string[], event: string, data: unknown) {
    for (const id of userIds) {
      this.emitToUser(id, event, data);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: unknown) {
    return { event: 'pong', data, clientId: client.id };
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { conversationId?: string; peerUserId?: string; isTyping?: boolean },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !body?.peerUserId || !body?.conversationId) return;
    this.emitToUser(body.peerUserId, 'chat:typing', {
      conversationId: body.conversationId,
      userId,
      isTyping: Boolean(body.isTyping),
    });
  }

  /** Relays WebRTC offer/answer/ICE between the two participants of an active call. */
  @SubscribeMessage('video-call:signal')
  async handleVideoCallSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { callId?: string; signal?: unknown },
  ) {
    const peerUserId = await this.resolveCallPeer(client, body?.callId);
    if (!peerUserId || body?.signal == null) return;
    this.emitToUser(peerUserId, 'video-call:signal', {
      callId: body.callId,
      fromUserId: client.data.userId as string,
      signal: body.signal,
    });
  }

  /** Tells the other participant that this side is ready to negotiate. */
  @SubscribeMessage('video-call:ready')
  async handleVideoCallReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { callId?: string },
  ) {
    const peerUserId = await this.resolveCallPeer(client, body?.callId);
    if (!peerUserId) return;
    this.emitToUser(peerUserId, 'video-call:peer-ready', {
      callId: body.callId,
      fromUserId: client.data.userId as string,
    });
  }

  private async resolveCallPeer(client: Socket, callId?: string): Promise<string | null> {
    const userId = client.data.userId as string | undefined;
    if (!userId || !callId) return null;

    const call = await this.prisma.videoCall.findUnique({
      where: { id: callId },
      select: { clientId: true, modelId: true, status: true },
    });
    if (!call || call.status !== VideoCallStatus.ACTIVE) return null;
    if (call.clientId !== userId && call.modelId !== userId) return null;

    return call.clientId === userId ? call.modelId : call.clientId;
  }
}
