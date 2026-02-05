import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventStatus, EventCategory, Visibility } from '@prisma/client';
import { RecurrenceService, RecurrenceRule } from './recurrence.service';
import { AchievementService } from '../achievement/achievement.service';

interface CreateEventDto {
  familyId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  isAllDay: boolean;
  category: EventCategory;
  visibility: Visibility;
  assigneeId?: string;
  recurrence?: RecurrenceRule;
  reminders: Array<{ type: string; beforeMinutes?: number }>;
}

interface UpdateEventDto extends Partial<CreateEventDto> {}

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private recurrenceService: RecurrenceService,
    private achievementService: AchievementService,
  ) {}

  // 创建事件
  async create(userId: string, dto: CreateEventDto) {
    // 验证用户是否是家庭成员
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId: dto.familyId },
    });

    if (!member) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    // 确定状态：如果是替别人创建，状态为待确认
    const status =
      dto.assigneeId && dto.assigneeId !== userId
        ? EventStatus.PENDING
        : EventStatus.CONFIRMED;

    // 处理重复规则
    const isRecurring = !!dto.recurrence;
    const recurrenceData = dto.recurrence
      ? {
          isRecurring: true,
          recurrenceRule: dto.recurrence.type,
          recurrenceEnd: dto.recurrence.endDate
            ? new Date(dto.recurrence.endDate)
            : null,
          recurrenceCount: dto.recurrence.count || null,
          recurrenceData: {
            weekdays: dto.recurrence.weekdays,
            monthDay: dto.recurrence.monthDay,
          },
        }
      : {
          isRecurring: false,
        };

    const event = await this.prisma.event.create({
      data: {
        familyId: dto.familyId,
        title: dto.title,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        isAllDay: dto.isAllDay,
        category: dto.category,
        visibility: dto.visibility,
        status,
        creatorId: userId,
        assigneeId: dto.assigneeId || userId,
        ...recurrenceData,
        reminders: {
          create: dto.reminders.map((r) => ({
            type: r.type as any,
            beforeMinutes: r.beforeMinutes,
            scheduledAt: this.calculateReminderTime(
              new Date(dto.startTime),
              r.beforeMinutes,
            ),
          })),
        },
      },
      include: {
        creator: { select: { id: true, nickname: true } },
        assignee: { select: { id: true, nickname: true } },
        reminders: true,
      },
    });

    // 更新成就统计并检查成就
    const isForOthers = dto.assigneeId && dto.assigneeId !== userId;
    await this.achievementService.updateStatsOnEventCreated(
      userId,
      dto.category,
      !!isForOthers,
    );
    await this.achievementService.checkAchievement(userId, 'EVENT_CREATED', {
      category: dto.category,
    });

    // 如果是为他人创建，也检查贴心助手成就
    if (isForOthers) {
      const stats = await this.achievementService.getUserStats(userId);
      await this.achievementService.checkAchievement(userId, 'EVENT_CREATED', {
        category: dto.category,
      });
    }

    return event;
  }

  // 计算提醒时间
  private calculateReminderTime(eventTime: Date, beforeMinutes?: number): Date {
    if (!beforeMinutes) {
      return eventTime;
    }
    return new Date(eventTime.getTime() - beforeMinutes * 60 * 1000);
  }

  // 获取事件列表
  async findByDateRange(
    userId: string,
    familyId: string,
    startDate: string,
    endDate: string,
  ) {
    // 验证日期格式
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      throw new BadRequestException(`无效的开始日期: ${startDate}`);
    }

    if (isNaN(end.getTime())) {
      throw new BadRequestException(`无效的结束日期: ${endDate}`);
    }

    // 验证用户是否是家庭成员
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId },
    });

    if (!member) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    // 查询非重复事件
    const nonRecurringEvents = await this.prisma.event.findMany({
      where: {
        familyId,
        isRecurring: false,
        startTime: {
          gte: start,
          lte: new Date(endDate + 'T23:59:59'),
        },
        OR: [
          { visibility: Visibility.FAMILY },
          { visibility: Visibility.PRIVATE, creatorId: userId },
          { visibility: Visibility.PRIVATE, assigneeId: userId },
        ],
      },
      include: {
        creator: { select: { id: true, nickname: true } },
        assignee: { select: { id: true, nickname: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // 查询重复事件（主事件）
    const recurringEvents = await this.prisma.event.findMany({
      where: {
        familyId,
        isRecurring: true,
        seriesMasterId: null, // 只查询主事件
        OR: [
          { visibility: Visibility.FAMILY },
          { visibility: Visibility.PRIVATE, creatorId: userId },
          { visibility: Visibility.PRIVATE, assigneeId: userId },
        ],
      },
      include: {
        creator: { select: { id: true, nickname: true } },
        assignee: { select: { id: true, nickname: true } },
      },
    });

    // 生成重复事件的实例
    const recurringInstances: any[] = [];
    for (const event of recurringEvents) {
      const rule: RecurrenceRule = {
        type: event.recurrenceRule as any,
        endDate: event.recurrenceEnd?.toISOString().split('T')[0],
        count: event.recurrenceCount || undefined,
        weekdays: (event.recurrenceData as any)?.weekdays,
        monthDay: (event.recurrenceData as any)?.monthDay,
      };

      const occurrences = this.recurrenceService.getOccurrencesInRange(
        event.startTime,
        rule,
        start,
        end,
      );

      // 为每个实例创建虚拟事件对象
      for (const occurrence of occurrences) {
        const duration = event.endTime
          ? event.endTime.getTime() - event.startTime.getTime()
          : 0;

        recurringInstances.push({
          ...event,
          id: `${event.id}_${occurrence.toISOString().split('T')[0]}`, // 虚拟ID
          startTime: occurrence,
          endTime: duration ? new Date(occurrence.getTime() + duration) : null,
          originalDate: occurrence,
          seriesMasterId: event.id,
          isInstance: true, // 标记为实例
        });
      }
    }

    // 合并并按时间排序
    const allEvents = [...nonRecurringEvents, ...recurringInstances].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    return allEvents;
  }

  // 搜索事件
  async searchEvents(
    userId: string,
    familyId: string,
    keyword: string,
    limit = 20,
  ) {
    // 验证用户是否是家庭成员
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId },
    });

    if (!member) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    const events = await this.prisma.event.findMany({
      where: {
        familyId,
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
        AND: [
          {
            OR: [
              { visibility: Visibility.FAMILY },
              { visibility: Visibility.PRIVATE, creatorId: userId },
              { visibility: Visibility.PRIVATE, assigneeId: userId },
            ],
          },
        ],
      },
      include: {
        creator: { select: { id: true, nickname: true } },
        assignee: { select: { id: true, nickname: true } },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    });

    return events;
  }

  // 获取待确认事件
  async getPendingEvents(userId: string, familyId: string) {
    return this.prisma.event.findMany({
      where: {
        familyId,
        assigneeId: userId,
        status: EventStatus.PENDING,
      },
      include: {
        creator: { select: { id: true, nickname: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 获取事件详情
  async findById(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: { select: { id: true, nickname: true } },
        assignee: { select: { id: true, nickname: true } },
        reminders: true,
      },
    });

    if (!event) {
      throw new NotFoundException('事件不存在');
    }

    // 检查可见性权限
    if (event.visibility === Visibility.PRIVATE) {
      if (event.creatorId !== userId && event.assigneeId !== userId) {
        throw new ForbiddenException('无权查看该事件');
      }
    } else {
      // 检查是否是家庭成员
      const member = await this.prisma.familyMember.findFirst({
        where: { userId, familyId: event.familyId },
      });

      if (!member) {
        throw new ForbiddenException('无权查看该事件');
      }
    }

    return event;
  }

  // 更新事件
  async update(userId: string, eventId: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('事件不存在');
    }

    // 只有创建者或被指派人可以修改
    if (event.creatorId !== userId && event.assigneeId !== userId) {
      throw new ForbiddenException('无权修改该事件');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        title: dto.title,
        description: dto.description,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        isAllDay: dto.isAllDay,
        category: dto.category,
        visibility: dto.visibility,
        // recurrence: dto.recurrence, // 移除这个字段，因为 Prisma schema 中没有这个字段
      },
      include: {
        creator: { select: { id: true, nickname: true } },
        assignee: { select: { id: true, nickname: true } },
      },
    });
  }

  // 删除事件
  async delete(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('事件不存在');
    }

    // 只有创建者可以删除
    if (event.creatorId !== userId) {
      throw new ForbiddenException('只有创建者可以删除事件');
    }

    await this.prisma.event.delete({
      where: { id: eventId },
    });

    return { success: true };
  }

  // 接受事件
  async accept(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('事件不存在');
    }

    if (event.assigneeId !== userId) {
      throw new ForbiddenException('只有被指派人可以接受事件');
    }

    if (event.status !== EventStatus.PENDING) {
      throw new ForbiddenException('该事件状态不允许此操作');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.CONFIRMED },
    }).then(async (result) => {
      // 更新成就统计
      await this.achievementService.updateStatsOnEventAccepted(userId);
      await this.achievementService.checkAchievement(userId, 'EVENT_ACCEPTED');
      return result;
    });
  }

  // 拒绝事件
  async reject(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('事件不存在');
    }

    if (event.assigneeId !== userId) {
      throw new ForbiddenException('只有被指派人可以拒绝事件');
    }

    if (event.status !== EventStatus.PENDING) {
      throw new ForbiddenException('该事件状态不允许此操作');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.REJECTED },
    });
  }

  // 导出事件为 iCal 格式
  async exportToICal(userId: string, familyId: string, startDate: string, endDate: string): Promise<string> {
    // 验证用户是否是家庭成员
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId },
    });

    if (!member) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
    });

    const events = await this.prisma.event.findMany({
      where: {
        familyId,
        startTime: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59'),
        },
        OR: [
          { visibility: 'FAMILY' },
          { visibility: 'PRIVATE', creatorId: userId },
          { visibility: 'PRIVATE', assigneeId: userId },
        ],
      },
      orderBy: { startTime: 'asc' },
    });

    // 生成 iCal 内容
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FamTime//Family Calendar//CN',
      `X-WR-CALNAME:${family?.name || 'FamTime'} 家庭日历`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const event of events) {
      const uid = `${event.id}@famtime.app`;
      const dtstamp = this.formatICalDate(new Date());
      const dtstart = event.isAllDay
        ? this.formatICalDateOnly(event.startTime)
        : this.formatICalDate(event.startTime);
      const dtend = event.endTime
        ? (event.isAllDay ? this.formatICalDateOnly(event.endTime) : this.formatICalDate(event.endTime))
        : dtstart;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);

      if (event.isAllDay) {
        lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
        lines.push(`DTEND;VALUE=DATE:${dtend}`);
      } else {
        lines.push(`DTSTART:${dtstart}`);
        lines.push(`DTEND:${dtend}`);
      }

      lines.push(`SUMMARY:${this.escapeICalText(event.title)}`);

      if (event.description) {
        lines.push(`DESCRIPTION:${this.escapeICalText(event.description)}`);
      }

      lines.push(`CATEGORIES:${event.category}`);
      lines.push(`STATUS:${event.status === 'CONFIRMED' ? 'CONFIRMED' : 'TENTATIVE'}`);
      lines.push(`CREATED:${this.formatICalDate(event.createdAt)}`);
      lines.push(`LAST-MODIFIED:${this.formatICalDate(event.updatedAt)}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  // 格式化日期为 iCal 格式 (YYYYMMDDTHHMMSSZ)
  private formatICalDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  // 格式化日期为 iCal 日期格式 (YYYYMMDD)
  private formatICalDateOnly(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  // 转义 iCal 文本中的特殊字符
  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }
}
