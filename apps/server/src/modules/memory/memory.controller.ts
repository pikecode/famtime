import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MemoryService } from './memory.service';

// @UseGuards(JwtAuthGuard)
@Controller('memories')
export class MemoryController {
  constructor(private memoryService: MemoryService) {}

  // 生成月度回忆录
  @Post('generate/monthly')
  async generateMonthly(
    @Request() req,
    @Query('familyId') familyId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.memoryService.generateMonthlyMemory(
      familyId,
      parseInt(year),
      parseInt(month),
    );
  }

  // 获取家庭的所有回忆录
  @Get('family/:familyId')
  async findByFamily(@Request() req, @Param('familyId') familyId: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.memoryService.findByFamily(userId, familyId);
  }

  // 获取回忆录详情
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.memoryService.findOne(userId, id);
  }
}
