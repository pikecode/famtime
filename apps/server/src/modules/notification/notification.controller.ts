import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';

@Controller('notification')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  // 获取通知列表
  @Get('list')
  async getNotifications(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.notificationService.getUserNotifications(
      req.user.id,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );

    return {
      code: 0,
      message: 'success',
      data: result,
    };
  }

  // 获取未读数量
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.id);

    return {
      code: 0,
      message: 'success',
      data: { count },
    };
  }

  // 标记单个通知为已读
  @Post(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    await this.notificationService.markAsRead(req.user.id, id);

    return {
      code: 0,
      message: 'success',
    };
  }

  // 标记所有通知为已读
  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    await this.notificationService.markAllAsRead(req.user.id);

    return {
      code: 0,
      message: 'success',
    };
  }

  // 删除通知
  @Delete(':id')
  async deleteNotification(@Request() req: any, @Param('id') id: string) {
    await this.notificationService.deleteNotification(req.user.id, id);

    return {
      code: 0,
      message: 'success',
    };
  }

  // 测试发送通知
  @Post('test')
  async testNotification(@Request() req: any) {
    const result = await this.notificationService.sendEventReminder(
      req.user.id,
      '测试日程',
      '2026-01-24 10:00',
      'test-event-id',
    );

    return {
      code: 0,
      message: 'success',
      data: { sent: result },
    };
  }
}
