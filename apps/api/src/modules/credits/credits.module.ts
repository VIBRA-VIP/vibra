import { Module } from '@nestjs/common';
import { CreditsController } from './controllers/credits.controller';
import { CreditsService } from './services/credits.service';

@Module({
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
