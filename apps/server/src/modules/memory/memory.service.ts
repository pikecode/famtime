import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryType, EventCategory } from '@prisma/client';

@Injectable()
export class MemoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成月度回忆录
   */
  async generateMonthlyMemory(familyId: string, year: number, month: number) {
    const period = `${year}-${String(month).padStart(2, '0')}`;

    // 检查是否已存在
    const existing = await this.prisma.familyMemory.findUnique({
      where: {
        familyId_type_period: {
          familyId,
          type: MemoryType.MONTHLY,
          period,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // 获取该月的所有事件
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await this.prisma.event.findMany({
      where: {
        familyId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        status: 'CONFIRMED',
      },
      orderBy: { startTime: 'asc' },
    });

    if (events.length === 0) {
      throw new NotFoundException('该月没有事件记录');
    }

    // 生成标题和摘要
    const title = this.generateTitle(year, month, events.length);
    const summary = this.generateSummary(events);
    const highlights = this.extractHighlights(events);

    // 创建回忆录
    const memory = await this.prisma.familyMemory.create({
      data: {
        familyId,
        type: MemoryType.MONTHLY,
        period,
        title,
        summary,
        eventCount: events.length,
        highlights: highlights as any,
      },
    });

    return memory;
  }

  /**
   * 获取家庭的所有回忆录
   */
  async findByFamily(userId: string, familyId: string) {
    // 验证用户是否是家庭成员
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId },
    });

    if (!member) {
      throw new ForbiddenException('无权查看该家庭的回忆录');
    }

    const memories = await this.prisma.familyMemory.findMany({
      where: { familyId },
      orderBy: { period: 'desc' },
    });

    return memories;
  }

  /**
   * 获取单个回忆录详情
   */
  async findOne(userId: string, memoryId: string) {
    const memory = await this.prisma.familyMemory.findUnique({
      where: { id: memoryId },
      include: { family: true },
    });

    if (!memory) {
      throw new NotFoundException('回忆录不存在');
    }

    // 验证权限
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId: memory.familyId },
    });

    if (!member) {
      throw new ForbiddenException('无权查看该回忆录');
    }

    return memory;
  }

  /**
   * 生成标题
   */
  private generateTitle(year: number, month: number, eventCount: number): string {
    const monthNames = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];

    return `${year}年${monthNames[month - 1]}的美好时光`;
  }

  /**
   * 生成摘要
   */
  private generateSummary(events: any[]): string {
    const categoryCount: Record<string, number> = {};

    events.forEach(event => {
      categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
    });

    const summaryParts: string[] = [];

    // 统计各类事件
    if (categoryCount[EventCategory.BIRTHDAY]) {
      summaryParts.push(`庆祝了${categoryCount[EventCategory.BIRTHDAY]}个生日`);
    }
    if (categoryCount[EventCategory.FAMILY_ACTIVITY]) {
      summaryParts.push(`进行了${categoryCount[EventCategory.FAMILY_ACTIVITY]}次家庭活动`);
    }
    if (categoryCount[EventCategory.HEALTH]) {
      summaryParts.push(`完成了${categoryCount[EventCategory.HEALTH]}次健康记录`);
    }
    if (categoryCount[EventCategory.ANNIVERSARY]) {
      summaryParts.push(`纪念了${categoryCount[EventCategory.ANNIVERSARY]}个特殊日子`);
    }

    const summary = summaryParts.length > 0
      ? `这个月，我们${summaryParts.join('，')}。共记录了${events.length}个珍贵时刻，每一个都值得回味。`
      : `这个月，我们共记录了${events.length}个珍贵时刻，每一个都值得回味。`;

    return summary;
  }

  /**
   * 提取重要事件
   */
  private extractHighlights(events: any[]) {
    // 优先级：生日 > 纪念日 > 家庭活动 > 其他
    const priorityOrder = [
      EventCategory.BIRTHDAY,
      EventCategory.ANNIVERSARY,
      EventCategory.FAMILY_ACTIVITY,
      EventCategory.HEALTH,
      EventCategory.REMINDER,
      EventCategory.OTHER,
    ];

    const sorted = [...events].sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.category);
      const bPriority = priorityOrder.indexOf(b.category);
      return aPriority - bPriority;
    });

    // 取前5个重要事件
    return sorted.slice(0, 5).map(event => ({
      eventId: event.id,
      title: event.title,
      date: event.startTime.toISOString(),
      category: event.category,
    }));
  }
}
