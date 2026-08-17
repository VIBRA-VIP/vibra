import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { MediaModule } from './modules/media/media.module';
import { ChatModule } from './modules/chat/chat.module';
import { VideoCallModule } from './modules/video-call/video-call.module';
import { CreditsModule } from './modules/credits/credits.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { PostsModule } from './modules/posts/posts.module';
import { PayoutsModule } from './modules/payouts/payouts.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    MediaModule,
    ChatModule,
    VideoCallModule,
    CreditsModule,
    PayoutsModule,
    NotificationsModule,
    AdminModule,
    PostsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
