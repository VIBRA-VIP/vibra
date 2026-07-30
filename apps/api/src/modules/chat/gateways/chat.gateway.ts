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
import { Server, Socket } from 'socket.io';

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

  constructor(private readonly jwt: JwtService) {}

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
}
