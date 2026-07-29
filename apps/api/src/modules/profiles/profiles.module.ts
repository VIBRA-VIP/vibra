import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesController } from './controllers/profiles.controller';
import { ProfilesService } from './services/profiles.service';

@Module({
  imports: [AuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
