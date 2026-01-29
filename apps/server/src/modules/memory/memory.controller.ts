import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MemoryService } from './memory.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { FamilyMemberGuard } from '../../guards/family-member.guard';
import { FamilyMember } from '../../decorators/family-member.decorator';

@Controller('memories')
@UseGuards(AuthGuard('jwt'))
export class MemoryController {
  constructor(private memoryService: MemoryService) {}

  // 生成月度回忆录
  @Post('generate/monthly')
  @UseGuards(FamilyMemberGuard)
  async generateMonthly(
    @CurrentUser() user: any,
    @Body() body: { familyId: string; year: number; month: number },
    @FamilyMember() member: any,
  ) {
    const memory = await this.memoryService.generateMonthlyMemory(
      body.familyId,
      body.year,
      body.month,
    );
    return {
      code: 0,
      message: 'success',
      data: memory,
    };
  }

  // 获取家庭的所有回忆录
  @Get('family/:familyId')
  @UseGuards(FamilyMemberGuard)
  async findByFamily(
    @CurrentUser() user: any,
    @Param('familyId') familyId: string,
    @FamilyMember() member: any,
  ) {
    const memories = await this.memoryService.findByFamily(user.id, familyId);
    return {
      code: 0,
      message: 'success',
      data: memories,
    };
  }

  // 获取回忆录详情
  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const memory = await this.memoryService.findOne(user.id, id);
    return {
      code: 0,
      message: 'success',
      data: memory,
    };
  }
}
