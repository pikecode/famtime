import { PrismaClient, AchievementCategory, AchievementType } from '@prisma/client';

const achievements = [
  // 新手引导类
  {
    key: 'first_family',
    name: '家的开始',
    description: '创建第一个家庭',
    icon: '🏠',
    category: AchievementCategory.ONBOARDING,
    type: AchievementType.ONE_TIME,
    target: 1,
    points: 20,
    order: 1,
  },
  {
    key: 'first_event',
    name: '第一步',
    description: '创建第一个日程',
    icon: '📅',
    category: AchievementCategory.ONBOARDING,
    type: AchievementType.ONE_TIME,
    target: 1,
    points: 10,
    order: 2,
  },
  {
    key: 'first_invite',
    name: '团聚时刻',
    description: '邀请第一位家庭成员',
    icon: '👨‍👩‍👧',
    category: AchievementCategory.ONBOARDING,
    type: AchievementType.ONE_TIME,
    target: 1,
    points: 20,
    order: 3,
  },

  // 日程创建类
  {
    key: 'events_10',
    name: '日程新手',
    description: '创建 10 个日程',
    icon: '📝',
    category: AchievementCategory.EVENT,
    type: AchievementType.CUMULATIVE,
    target: 10,
    points: 20,
    order: 4,
  },
  {
    key: 'events_50',
    name: '日程达人',
    description: '创建 50 个日程',
    icon: '🌟',
    category: AchievementCategory.EVENT,
    type: AchievementType.CUMULATIVE,
    target: 50,
    points: 50,
    order: 5,
  },
  {
    key: 'birthday_5',
    name: '生日管家',
    description: '创建 5 个生日日程',
    icon: '🎂',
    category: AchievementCategory.EVENT,
    type: AchievementType.CUMULATIVE,
    target: 5,
    points: 30,
    order: 6,
  },
  {
    key: 'family_activity_10',
    name: '活动策划师',
    description: '创建 10 个家庭活动',
    icon: '🎉',
    category: AchievementCategory.EVENT,
    type: AchievementType.CUMULATIVE,
    target: 10,
    points: 30,
    order: 7,
  },

  // 家庭互动类
  {
    key: 'events_for_others_5',
    name: '贴心助手',
    description: '为他人创建 5 个日程',
    icon: '💝',
    category: AchievementCategory.FAMILY,
    type: AchievementType.CUMULATIVE,
    target: 5,
    points: 30,
    order: 8,
  },
  {
    key: 'accepted_events_5',
    name: '积极响应',
    description: '接受 5 个他人创建的日程',
    icon: '✅',
    category: AchievementCategory.FAMILY,
    type: AchievementType.CUMULATIVE,
    target: 5,
    points: 20,
    order: 9,
  },
  {
    key: 'comments_10',
    name: '互动达人',
    description: '发表 10 条评论',
    icon: '💬',
    category: AchievementCategory.FAMILY,
    type: AchievementType.CUMULATIVE,
    target: 10,
    points: 20,
    order: 10,
  },

  // 连续性类
  {
    key: 'streak_3',
    name: '三天打卡',
    description: '连续 3 天创建日程',
    icon: '🔥',
    category: AchievementCategory.STREAK,
    type: AchievementType.STREAK,
    target: 3,
    points: 20,
    order: 11,
  },
  {
    key: 'streak_7',
    name: '一周坚持',
    description: '连续 7 天创建日程',
    icon: '💪',
    category: AchievementCategory.STREAK,
    type: AchievementType.STREAK,
    target: 7,
    points: 50,
    order: 12,
  },

  // 回忆录类
  {
    key: 'first_memory',
    name: '回忆收藏家',
    description: '生成第一个月度回忆录',
    icon: '📸',
    category: AchievementCategory.MEMORY,
    type: AchievementType.ONE_TIME,
    target: 1,
    points: 30,
    order: 13,
  },
  {
    key: 'memories_3',
    name: '时光记录者',
    description: '生成 3 个月度回忆录',
    icon: '📚',
    category: AchievementCategory.MEMORY,
    type: AchievementType.CUMULATIVE,
    target: 3,
    points: 50,
    order: 14,
  },

  // 特殊成就
  {
    key: 'all_categories',
    name: '全能管家',
    description: '创建所有 6 种分类的日程',
    icon: '🏆',
    category: AchievementCategory.SPECIAL,
    type: AchievementType.ONE_TIME,
    target: 6,
    points: 100,
    order: 15,
  },
];

export async function seedAchievements(prisma: PrismaClient) {
  console.log('Seeding achievements...');

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`Seeded ${achievements.length} achievements`);
}

// 如果直接运行此文件
if (require.main === module) {
  const prisma = new PrismaClient();
  seedAchievements(prisma)
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
    });
}
