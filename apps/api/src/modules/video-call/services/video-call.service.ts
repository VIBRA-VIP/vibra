import { Injectable } from '@nestjs/common';

@Injectable()
export class VideoCallService {
  health() {
    return { module: 'video-call', status: 'ok' };
  }
}
