import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentService } from './comment.service';

// 临时的认证守卫占位符
// @UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  // 创建评论
  @Post()
  async create(@Request() req, @Body() dto: { eventId: string; content: string }) {
    // 临时使用 mock userId，实际应从 JWT token 获取
    const userId = req.user?.id || 'mock-user-id';
    return this.commentService.create(userId, dto);
  }

  // 获取事件的所有评论
  @Get('event/:eventId')
  async findByEvent(@Request() req, @Param('eventId') eventId: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.commentService.findByEvent(userId, eventId);
  }

  // 删除评论
  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.commentService.delete(userId, id);
  }
}
