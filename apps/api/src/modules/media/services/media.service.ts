import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaService {
  health() {
    return { module: 'media', status: 'ok' };
  }
}
