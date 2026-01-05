import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventStatus, EventCategory, Visibility } from '@prisma/client';

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
  recurrence?: object;
  reminders: Array<{ type: string; beforeMinutes?: number }>;
}

interface UpdateEventDto extends Partial<CreateEventDto> {}

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

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
        recurrence: dto.recurrence || null,
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
        startTime: {
          gte: new Date(startDate),
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
        recurrence: dto.recurrence,
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
}
