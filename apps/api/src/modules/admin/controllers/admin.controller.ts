import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminUnlockDto } from '../dto/admin-unlock.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminService } from '../services/admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  health() {
    return this.adminService.health();
  }

  @Post('unlock')
  unlock(@Body() body: AdminUnlockDto) {
    return this.adminService.unlock(body.key);
  }

  @UseGuards(AdminAuthGuard)
  @Get('dashboard')
  dashboard() {
    return this.adminService.getDashboard();
  }

  @UseGuards(AdminAuthGuard)
  @Get('models/pending')
  listPending() {
    return this.adminService.listPendingModels();
  }

  @UseGuards(AdminAuthGuard)
  @Post('models/:userId/approve')
  approve(@Param('userId') userId: string) {
    return this.adminService.approveModel(userId);
  }

  @UseGuards(AdminAuthGuard)
  @Post('models/:userId/reject')
  reject(@Param('userId') userId: string) {
    return this.adminService.rejectModel(userId);
  }
}
