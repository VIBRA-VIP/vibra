import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { PayoutsService } from '../services/payouts.service';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  summary(@CurrentUser() user: { id: string }) {
    return this.payoutsService.summary(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('preview')
  preview(@CurrentUser() user: { id: string }, @Query('credits') credits?: string) {
    return this.payoutsService.preview(user.id, Number(credits) || 0);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.payoutsService.list(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: CreatePayoutDto) {
    return this.payoutsService.create(user.id, body.credits);
  }
}
