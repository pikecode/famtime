import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { FamilyModule } from './modules/family/family.module';
import { MemberModule } from './modules/member/member.module';
import { EventModule } from './modules/event/event.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { MemoryModule } from './modules/memory/memory.module';
import { NotificationModule } from './modules/notification/notification.module';
import { DebugModule } from './modules/debug/debug.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    FamilyModule,
    MemberModule,
    EventModule,
    ReminderModule,
    MemoryModule,
    NotificationModule,
    DebugModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
