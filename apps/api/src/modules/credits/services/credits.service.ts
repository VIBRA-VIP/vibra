import { Injectable } from '@nestjs/common';

@Injectable()
export class CreditsService {
  health() {
    return { module: 'credits', status: 'ok' };
  }
}
