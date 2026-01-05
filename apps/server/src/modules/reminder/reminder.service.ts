import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(private prisma: PrismaService) {}

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

  // 发送提醒（实际发送微信订阅消息）
  private async sendReminder(reminder: any) {
    const { event } = reminder;
    const targetUser = event.assignee || event.creator;

    // TODO: 调用微信订阅消息 API
    // 这里需要用户授权订阅消息

    this.logger.log(
      `[Mock] Sending reminder to ${targetUser.nickname} for event: ${event.title}`,
    );

    // 实际实现示例：
    // await this.wechatService.sendSubscribeMessage({
    //   touser: targetUser.openid,
    //   template_id: 'your-template-id',
    //   page: `/pages/event/detail/index?id=${event.id}`,
    //   data: {
    //     thing1: { value: event.title },
    //     time2: { value: event.startTime.toLocaleString() },
    //     thing3: { value: event.family.name },
    //   },
    // });
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
