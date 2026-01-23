import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // 每分钟检查需要发送的提醒
  @Cron(CronExpression.EVERY_MINUTE)
  async checkReminders() {
    const now = new Date();
    const oneMinuteLater = new Date(now.getTime() + 60 * 1000);

    // 查找需要发送的提醒
    const reminders = await this.prisma.eventReminder.findMany({
      where: {
        scheduledAt: {
          gte: now,
          lt: oneMinuteLater,
        },
        sentAt: null,
      },
      include: {
        event: {
          include: {
            assignee: true,
            creator: true,
            family: true,
          },
        },
      },
    });

    for (const reminder of reminders) {
      try {
        await this.sendReminder(reminder);

        // 标记为已发送
        await this.prisma.eventReminder.update({
          where: { id: reminder.id },
          data: { sentAt: new Date() },
        });

        this.logger.log(`Reminder sent for event: ${reminder.event.title}`);
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for event: ${reminder.event.title}`,
          error,
        );
      }
    }
  }

  // 发送提醒（调用微信订阅消息）
  private async sendReminder(reminder: any) {
    const { event } = reminder;
    const targetUser = event.assignee || event.creator;

    if (!targetUser) {
      this.logger.warn(`No target user for event: ${event.title}`);
      return;
    }

    // 格式化时间
    const eventTime = event.startTime.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    // 发送微信订阅消息
    await this.notificationService.sendEventReminder(
      targetUser.id,
      event.title,
      eventTime,
      event.id,
    );
  }

  // 获取去年今天的事件
  async getThisDayMemories(familyId: string) {
    const today = new Date();
    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const startOfDay = new Date(lastYear);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(lastYear);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.event.findMany({
      where: {
        familyId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        creator: { select: { id: true, nickname: true } },
      },
    });
  }

  // 获取月度总结
  async getMonthlySummary(familyId: string, year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const events = await this.prisma.event.findMany({
      where: {
        familyId,
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalEvents = events.length;
    const familyTime = events.filter(
      (e) => e.category === 'FAMILY_ACTIVITY',
    ).length;
    const importantDays = events.filter(
      (e) => e.category === 'BIRTHDAY' || e.category === 'ANNIVERSARY',
    ).length;
    const pendingCount = events.filter(
      (e) => e.status === 'PENDING',
    ).length;

    return {
      totalEvents,
      familyTime,
      importantDays,
      pendingCount,
    };
  }
}
