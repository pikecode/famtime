import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventCategory, AchievementType } from '@prisma/client';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取或创建用户统计
   */
  async getOrCreateStats(userId: string) {
    let stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });

    if (!stats) {
      stats = await this.prisma.userStats.create({
        data: { userId },
      });
    }

    return stats;
  }

  /**
   * 获取用户统计数据
   */
  async getUserStats(userId: string) {
    return this.getOrCreateStats(userId);
  }

  /**
   * 获取用户所有成就进度
   */
  async getUserAchievements(userId: string) {
    const achievements = await this.prisma.achievement.findMany({
      orderBy: { order: 'asc' },
    });

    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
    });

    const userAchievementMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua]),
    );

    return achievements.map((achievement) => {
      const userAchievement = userAchievementMap.get(achievement.id);
      return {
        ...achievement,
        progress: userAchievement?.progress || 0,
        isCompleted: userAchievement?.isCompleted || false,
        completedAt: userAchievement?.completedAt || null,
      };
    });
  }

  /**
   * 检查并更新成就进度
   */
  async checkAchievement(
    userId: string,
    eventType: string,
    metadata?: { category?: EventCategory },
  ) {
    try {
      const stats = await this.getOrCreateStats(userId);
      const unlockedAchievements: string[] = [];

      // 根据事件类型检查相关成就
      switch (eventType) {
        case 'EVENT_CREATED':
          await this.checkEventCreatedAchievements(
            userId,
            stats,
            metadata?.category,
            unlockedAchievements,
          );
          break;
        case 'FAMILY_CREATED':
          await this.checkOneTimeAchievement(
            userId,
            'first_family',
            unlockedAchievements,
          );
          break;
        case 'MEMBER_INVITED':
          await this.checkOneTimeAchievement(
            userId,
            'first_invite',
            unlockedAchievements,
          );
          break;
        case 'EVENT_ACCEPTED':
          await this.checkCumulativeAchievement(
            userId,
            'accepted_events_5',
            stats.acceptedEvents,
            unlockedAchievements,
          );
          break;
        case 'COMMENT_CREATED':
          await this.checkCumulativeAchievement(
            userId,
            'comments_10',
            stats.totalComments,
            unlockedAchievements,
          );
          break;
        case 'MEMORY_CREATED':
          await this.checkMemoryAchievements(
            userId,
            stats,
            unlockedAchievements,
          );
          break;
      }

      // 返回解锁的成就
      if (unlockedAchievements.length > 0) {
        const achievements = await this.prisma.achievement.findMany({
          where: { key: { in: unlockedAchievements } },
        });
        return achievements;
      }

      return [];
    } catch (error) {
      this.logger.error('Error checking achievement', error);
      return [];
    }
  }

  /**
   * 检查日程创建相关成就
   */
  private async checkEventCreatedAchievements(
    userId: string,
    stats: any,
    category: EventCategory | undefined,
    unlockedAchievements: string[],
  ) {
    // 第一个日程
    if (stats.totalEvents === 1) {
      await this.checkOneTimeAchievement(
        userId,
        'first_event',
        unlockedAchievements,
      );
    }

    // 日程数量成就
    await this.checkCumulativeAchievement(
      userId,
      'events_10',
      stats.totalEvents,
      unlockedAchievements,
    );
    await this.checkCumulativeAchievement(
      userId,
      'events_50',
      stats.totalEvents,
      unlockedAchievements,
    );

    // 分类成就
    if (category === EventCategory.BIRTHDAY) {
      await this.checkCumulativeAchievement(
        userId,
        'birthday_5',
        stats.birthdayEvents,
        unlockedAchievements,
      );
    }
    if (category === EventCategory.FAMILY_ACTIVITY) {
      await this.checkCumulativeAchievement(
        userId,
        'family_activity_10',
        stats.familyActivityEvents,
        unlockedAchievements,
      );
    }

    // 连续天数成就
    await this.checkStreakAchievement(
      userId,
      'streak_3',
      stats.currentStreak,
      unlockedAchievements,
    );
    await this.checkStreakAchievement(
      userId,
      'streak_7',
      stats.currentStreak,
      unlockedAchievements,
    );

    // 全能管家成就
    await this.checkAllCategoriesAchievement(userId, stats, unlockedAchievements);
  }

  /**
   * 检查回忆录相关成就
   */
  private async checkMemoryAchievements(
    userId: string,
    stats: any,
    unlockedAchievements: string[],
  ) {
    if (stats.totalMemories === 1) {
      await this.checkOneTimeAchievement(
        userId,
        'first_memory',
        unlockedAchievements,
      );
    }
    await this.checkCumulativeAchievement(
      userId,
      'memories_3',
      stats.totalMemories,
      unlockedAchievements,
    );
  }

  /**
   * 检查一次性成就
   */
  private async checkOneTimeAchievement(
    userId: string,
    achievementKey: string,
    unlockedAchievements: string[],
  ) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { key: achievementKey },
    });

    if (!achievement) return;

    const existing = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing?.isCompleted) return;

    await this.prisma.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
      update: {
        progress: 1,
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        achievementId: achievement.id,
        progress: 1,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // 更新用户积分
    await this.prisma.userStats.update({
      where: { userId },
      data: { totalPoints: { increment: achievement.points } },
    });

    unlockedAchievements.push(achievementKey);
  }

  /**
   * 检查累计型成就
   */
  private async checkCumulativeAchievement(
    userId: string,
    achievementKey: string,
    currentValue: number,
    unlockedAchievements: string[],
  ) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { key: achievementKey },
    });

    if (!achievement) return;

    const existing = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing?.isCompleted) return;

    const isCompleted = currentValue >= achievement.target;

    await this.prisma.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
      update: {
        progress: currentValue,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      create: {
        userId,
        achievementId: achievement.id,
        progress: currentValue,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    if (isCompleted) {
      await this.prisma.userStats.update({
        where: { userId },
        data: { totalPoints: { increment: achievement.points } },
      });
      unlockedAchievements.push(achievementKey);
    }
  }

  /**
   * 检查连续型成就
   */
  private async checkStreakAchievement(
    userId: string,
    achievementKey: string,
    currentStreak: number,
    unlockedAchievements: string[],
  ) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { key: achievementKey },
    });

    if (!achievement) return;

    const existing = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing?.isCompleted) return;

    const isCompleted = currentStreak >= achievement.target;

    await this.prisma.userAchievement.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
      update: {
        progress: Math.min(currentStreak, achievement.target),
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      create: {
        userId,
        achievementId: achievement.id,
        progress: Math.min(currentStreak, achievement.target),
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    if (isCompleted) {
      await this.prisma.userStats.update({
        where: { userId },
        data: { totalPoints: { increment: achievement.points } },
      });
      unlockedAchievements.push(achievementKey);
    }
  }

  /**
   * 检查全能管家成就（所有分类都创建过）
   */
  private async checkAllCategoriesAchievement(
    userId: string,
    stats: any,
    unlockedAchievements: string[],
  ) {
    const categoriesUsed = [
      stats.birthdayEvents > 0,
      stats.anniversaryEvents > 0,
      stats.healthEvents > 0,
      stats.familyActivityEvents > 0,
      stats.reminderEvents > 0,
      stats.otherEvents > 0,
    ].filter(Boolean).length;

    if (categoriesUsed === 6) {
      await this.checkOneTimeAchievement(
        userId,
        'all_categories',
        unlockedAchievements,
      );
    }
  }

  /**
   * 更新用户统计（创建日程时调用）
   */
  async updateStatsOnEventCreated(
    userId: string,
    category: EventCategory,
    isForOthers: boolean,
  ) {
    const stats = await this.getOrCreateStats(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastEventDate = stats.lastEventDate
      ? new Date(stats.lastEventDate)
      : null;
    lastEventDate?.setHours(0, 0, 0, 0);

    // 计算连续天数
    let newStreak = stats.currentStreak;
    if (lastEventDate) {
      const diffDays = Math.floor(
        (today.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        newStreak = stats.currentStreak + 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      // diffDays === 0 表示今天已经创建过，不增加连续天数
    } else {
      newStreak = 1;
    }

    // 更新分类统计
    const categoryField = this.getCategoryField(category);

    await this.prisma.userStats.update({
      where: { userId },
      data: {
        totalEvents: { increment: 1 },
        [categoryField]: { increment: 1 },
        eventsForOthers: isForOthers
          ? { increment: 1 }
          : stats.eventsForOthers,
        currentStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak, newStreak),
        lastEventDate: today,
      },
    });

    // 返回更新后的统计
    return this.prisma.userStats.findUnique({ where: { userId } });
  }

  /**
   * 更新用户统计（接受日程时调用）
   */
  async updateStatsOnEventAccepted(userId: string) {
    await this.prisma.userStats.upsert({
      where: { userId },
      update: { acceptedEvents: { increment: 1 } },
      create: { userId, acceptedEvents: 1 },
    });
  }

  /**
   * 更新用户统计（创建评论时调用）
   */
  async updateStatsOnCommentCreated(userId: string) {
    await this.prisma.userStats.upsert({
      where: { userId },
      update: { totalComments: { increment: 1 } },
      create: { userId, totalComments: 1 },
    });
  }

  /**
   * 更新用户统计（生成回忆录时调用）
   */
  async updateStatsOnMemoryCreated(userId: string) {
    await this.prisma.userStats.upsert({
      where: { userId },
      update: { totalMemories: { increment: 1 } },
      create: { userId, totalMemories: 1 },
    });
  }

  /**
   * 获取分类对应的统计字段
   */
  private getCategoryField(category: EventCategory): string {
    const mapping: Record<EventCategory, string> = {
      [EventCategory.BIRTHDAY]: 'birthdayEvents',
      [EventCategory.ANNIVERSARY]: 'anniversaryEvents',
      [EventCategory.HEALTH]: 'healthEvents',
      [EventCategory.FAMILY_ACTIVITY]: 'familyActivityEvents',
      [EventCategory.REMINDER]: 'reminderEvents',
      [EventCategory.OTHER]: 'otherEvents',
    };
    return mapping[category] || 'otherEvents';
  }
}
