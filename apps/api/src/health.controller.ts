import { Controller, Get } from '@nestjs/common';
import { APP_NAME } from '@vibra/shared';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: APP_NAME,
      timestamp: new Date().toISOString(),
    };
  }
}
