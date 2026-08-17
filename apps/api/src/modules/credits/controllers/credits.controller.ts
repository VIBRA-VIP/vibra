import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateCreditPurchaseDto } from '../dto/create-credit-purchase.dto';
import { CreditsService } from '../services/credits.service';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('packages')
  packages() {
    return this.creditsService.listPackages();
  }

  @Post('purchases')
  @UseGuards(JwtAuthGuard)
  createPurchase(
    @CurrentUser() user: { id: string; email?: string },
    @Body() body: CreateCreditPurchaseDto,
  ) {
    return this.creditsService.createPurchase(user.id, body.packageId, user.email);
  }

  @Get('purchases/:id')
  @UseGuards(JwtAuthGuard)
  getPurchase(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.creditsService.getPurchase(user.id, id);
  }

  @Post('purchases/:id/sync')
  @UseGuards(JwtAuthGuard)
  syncPurchase(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.creditsService.syncPurchase(user.id, id);
  }

  /** Bold webhook URL: POST {API_URL}/api/credits/webhooks/bold */
  @Post('webhooks/bold')
  boldWebhook(@Body() body: Record<string, unknown>) {
    return this.creditsService.handleBoldWebhook(body ?? {});
  }
}
