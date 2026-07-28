import { Controller, Get } from '@nestjs/common';
import { CreditsService } from '../services/credits.service';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('health')
  health() {
    return this.creditsService.health();
  }
}
