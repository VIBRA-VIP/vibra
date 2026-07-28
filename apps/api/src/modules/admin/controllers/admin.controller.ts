import { Controller, Get } from '@nestjs/common';
import { AdminService } from '../services/admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  health() {
    return this.adminService.health();
  }
}
