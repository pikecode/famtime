import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CurrentUser } from '../auth/current-user.decorator';

class SendReminderDto {
  eventId: string;
  eventTitle: string;
  eventTime: string;
}

@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Post('test')
  async testNotification(@CurrentUser() user: any) {
    const result = await this.notificationService.sendEventReminder(
      user.id,
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
