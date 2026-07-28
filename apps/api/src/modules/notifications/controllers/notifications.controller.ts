import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('health')
  health() {
    return this.notificationsService.health();
  }
}
