import { Module } from '@nestjs/common';
import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [AchievementModule],
  controllers: [MemoryController],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
