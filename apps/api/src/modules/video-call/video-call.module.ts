import { Module } from '@nestjs/common';
import { VideoCallController } from './controllers/video-call.controller';
import { VideoCallService } from './services/video-call.service';

@Module({
  controllers: [VideoCallController],
  providers: [VideoCallService],
  exports: [VideoCallService],
})
export class VideoCallModule {}
