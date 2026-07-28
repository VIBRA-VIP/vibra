import { Module } from '@nestjs/common';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { RealtimeGateway } from './gateways/chat.gateway';

@Module({
  controllers: [ChatController],
  providers: [ChatService, RealtimeGateway],
  exports: [ChatService],
})
export class ChatModule {}
