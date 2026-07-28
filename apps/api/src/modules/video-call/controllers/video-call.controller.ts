import { Controller, Get } from '@nestjs/common';
import { VideoCallService } from '../services/video-call.service';

@Controller('video-call')
export class VideoCallController {
  constructor(private readonly videoCallService: VideoCallService) {}

  @Get('health')
  health() {
    return this.videoCallService.health();
  }
}
