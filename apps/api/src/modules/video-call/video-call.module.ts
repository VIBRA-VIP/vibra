import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { VideoCallController } from './controllers/video-call.controller';
import { VideoCallService } from './services/video-call.service';

@Module({
  imports: [AuthModule, ChatModule],
  controllers: [VideoCallController],
  providers: [VideoCallService],
  exports: [VideoCallService],
})
export class VideoCallModule {}
