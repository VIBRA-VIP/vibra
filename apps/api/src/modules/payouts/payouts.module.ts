import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PayoutsController } from './controllers/payouts.controller';
import { PayoutsService } from './services/payouts.service';

@Module({
  imports: [AuthModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
