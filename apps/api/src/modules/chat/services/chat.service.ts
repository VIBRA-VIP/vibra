import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  health() {
    return { module: 'chat', status: 'ok' };
  }
}
