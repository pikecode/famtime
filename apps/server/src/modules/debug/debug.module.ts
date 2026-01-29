import { Module } from '@nestjs/common';
import { DebugController } from './debug.controller';
import { FamilyModule } from '../family/family.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [FamilyModule, PrismaModule],
  controllers: [DebugController],
})
export class DebugModule {}
