import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 开始初始化测试数据...');

  // 创建测试用户
  console.log('📝 创建测试用户...');
  const users = await Promise.all([
    prisma.user.upsert({
      where: { openid: 'test_openid_1' },
      update: {},
      create: {
        openid: 'test_openid_1',
        nickname: '爸爸',
      },
    }),
    prisma.user.upsert({
      where: { openid: 'test_openid_2' },
      update: {},
      create: {
        openid: 'test_openid_2',
        nickname: '妈妈',
      },
    }),
    prisma.user.upsert({
      where: { openid: 'test_openid_3' },
      update: {},
      create: {
        openid: 'test_openid_3',
        nickname: '小明',
      },
    }),
    prisma.user.upsert({
      where: { openid: 'test_openid_4' },
      update: {},
      create: {
        openid: 'test_openid_4',
        nickname: '小红',
      },
    }),
  ]);

  console.log(`✅ 创建了 ${users.length} 个测试用户`);

  // 创建测试家庭
  console.log('📝 创建测试家庭...');
  const family = await prisma.family.upsert({
    where: { inviteCode: 'TEST1234' },
    update: {},
    create: {
      name: '温馨之家',
      inviteCode: 'TEST1234',
      creatorId: users[0].id,
      adminId: users[0].id,
    },
  });

  console.log(`✅ 创建了测试家庭: ${family.name}`);

  // 添加家庭成员
  console.log('📝 添加家庭成员...');
  const colors = ['#339AF0', '#FF6B6B', '#51CF66', '#FF85A2'];
  const roles = ['ADMIN', 'MEMBER', 'MEMBER', 'MEMBER'] as const;

  for (let i = 0; i < users.length; i++) {
    await prisma.familyMember.upsert({
      where: {
        familyId_userId: {
          familyId: family.id,
          userId: users[i].id,
        },
      },
      update: {},
      create: {
        familyId: family.id,
        userId: users[i].id,
        nickname: users[i].nickname,
        role: roles[i],
        color: colors[i],
      },
    });
  }

  console.log(`✅ 添加了 ${users.length} 个家庭成员`);

  // 创建测试事件
  console.log('📝 创建测试事件...');
  const now = new Date();
  const events = [
    {
      title: '小明的生日派对',
      description: '准备蛋糕和礼物',
      startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      isAllDay: false,
      category: 'BIRTHDAY' as const,
      visibility: 'FAMILY' as const,
      status: 'CONFIRMED' as const,
      familyId: family.id,
      creatorId: users[0].id,
      assigneeId: users[2].id,
    },
    {
      title: '全家去公园野餐',
      description: '带上野餐垫和食物',
      startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      isAllDay: false,
      category: 'FAMILY_ACTIVITY' as const,
      visibility: 'FAMILY' as const,
      status: 'CONFIRMED' as const,
      familyId: family.id,
      creatorId: users[1].id,
    },
    {
      title: '爸爸体检',
      description: '年度健康检查',
      startTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      isAllDay: false,
      category: 'HEALTH' as const,
      visibility: 'FAMILY' as const,
      status: 'CONFIRMED' as const,
      familyId: family.id,
      creatorId: users[0].id,
      assigneeId: users[0].id,
    },
    {
      title: '结婚纪念日',
      description: '庆祝结婚10周年',
      startTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      isAllDay: true,
      category: 'ANNIVERSARY' as const,
      visibility: 'FAMILY' as const,
      status: 'CONFIRMED' as const,
      familyId: family.id,
      creatorId: users[0].id,
    },
  ];

  for (const eventData of events) {
    const event = await prisma.event.create({
      data: eventData,
    });

    // 添加提醒
    await prisma.eventReminder.create({
      data: {
        eventId: event.id,
        type: 'BEFORE',
        beforeMinutes: 1440,
        scheduledAt: new Date(event.startTime.getTime() - 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`✅ 创建了 ${events.length} 个测试事件`);

  console.log('\n✅ 测试数据初始化完成！');
  console.log('\n📊 测试数据概览：');
  console.log(`  - ${users.length}个测试用户（爸爸、妈妈、小明、小红）`);
  console.log(`  - 1个测试家庭（${family.name}）`);
  console.log(`  - ${events.length}个测试事件（生日、野餐、体检、纪念日）`);
  console.log(`  - 邀请码: ${family.inviteCode}`);
  console.log('\n🔑 测试账号：');
  users.forEach((user) => {
    console.log(`  - openid: ${user.openid} (${user.nickname})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
