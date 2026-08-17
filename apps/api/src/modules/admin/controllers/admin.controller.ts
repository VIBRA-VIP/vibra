import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AdminUnlockDto } from '../dto/admin-unlock.dto';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminService } from '../services/admin.service';
import { PayoutsService } from '../../payouts/services/payouts.service';

class RejectPayoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly payoutsService: PayoutsService,
  ) {}

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

  @UseGuards(AdminAuthGuard)
  @Get('payouts')
  listPayouts(@Query('status') status?: string) {
    return this.payoutsService.listForAdmin(status);
  }

  @UseGuards(AdminAuthGuard)
  @Post('payouts/:id/paid')
  markPayoutPaid(@Param('id', ParseUUIDPipe) id: string) {
    return this.payoutsService.markPaid(id);
  }

  @UseGuards(AdminAuthGuard)
  @Post('payouts/:id/reject')
  rejectPayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectPayoutDto,
  ) {
    return this.payoutsService.markRejected(id, body.note);
  }
}
