import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { RealtimeGateway } from './gateways/chat.gateway';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, RealtimeGateway],
  exports: [ChatService, RealtimeGateway],
})
export class ChatModule {}
