import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreditsController } from './controllers/credits.controller';
import { BoldPaymentsService } from './services/bold-payments.service';
import { CreditsService } from './services/credits.service';

@Module({
  imports: [AuthModule],
  controllers: [CreditsController],
  providers: [CreditsService, BoldPaymentsService],
  exports: [CreditsService],
})
export class CreditsModule {}
