import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { Env } from '../../config/env.schema';
import { DatabaseModule } from '../../database/database.module';
import { MailModule } from '../mail/mail.module';
import { AdminController } from './controllers/admin.controller';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminService } from './services/admin.service';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminAuthGuard],
  exports: [AdminService],
})
export class AdminModule {}
