#!/bin/bash

# FamTime 测试数据初始化脚本

echo "🚀 开始初始化测试数据..."

# 设置数据库连接
export DATABASE_URL="postgresql://postgres:password@localhost:5432/famtime?schema=public"

# 使用 Prisma Studio 或直接执行 SQL
cd "$(dirname "$0")/../apps/server"

# 创建测试家庭
echo "📝 创建测试家庭..."

# 使用 psql 执行 SQL
psql $DATABASE_URL << 'EOF'

-- 清理现有测试数据（可选）
-- DELETE FROM event_reminders;
-- DELETE FROM event_comments;
-- DELETE FROM events;
-- DELETE FROM family_members;
-- DELETE FROM families;
-- DELETE FROM users;

-- 创建测试用户
INSERT INTO users (id, openid, nickname, avatar, "createdAt", "updatedAt")
VALUES
  ('test_user_1', 'test_openid_1', '爸爸', NULL, NOW(), NOW()),
  ('test_user_2', 'test_openid_2', '妈妈', NULL, NOW(), NOW()),
  ('test_user_3', 'test_openid_3', '小明', NULL, NOW(), NOW()),
  ('test_user_4', 'test_openid_4', '小红', NULL, NOW(), NOW())
ON CONFLICT (openid) DO NOTHING;

-- 创建测试家庭
INSERT INTO families (id, name, avatar, "inviteCode", "creatorId", "adminId", "createdAt", "updatedAt")
VALUES ('test_family_1', '温馨之家', NULL, 'TEST1234', 'test_user_1', 'test_user_1', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 添加家庭成员
INSERT INTO family_members (id, nickname, role, color, "joinedAt", "familyId", "userId")
VALUES
  ('test_member_1', '爸爸', 'ADMIN', '#339AF0', NOW(), 'test_family_1', 'test_user_1'),
  ('test_member_2', '妈妈', 'MEMBER', '#FF6B6B', NOW(), 'test_family_1', 'test_user_2'),
  ('test_member_3', '小明', 'MEMBER', '#51CF66', NOW(), 'test_family_1', 'test_user_3'),
  ('test_member_4', '小红', 'MEMBER', '#FF85A2', NOW(), 'test_family_1', 'test_user_4')
ON CONFLICT ("familyId", "userId") DO NOTHING;

-- 创建测试事件
INSERT INTO events (id, title, description, "startTime", "endTime", "isAllDay", category, visibility, status, "createdAt", "updatedAt", "familyId", "creatorId", "assigneeId")
VALUES
  ('test_event_1', '小明的生日派对', '准备蛋糕和礼物', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', false, 'BIRTHDAY', 'FAMILY', 'CONFIRMED', NOW(), NOW(), 'test_family_1', 'test_user_1', 'test_user_3'),
  ('test_event_2', '全家去公园野餐', '带上野餐垫和食物', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '4 hours', false, 'FAMILY_ACTIVITY', 'FAMILY', 'CONFIRMED', NOW(), NOW(), 'test_family_1', 'test_user_2', NULL),
  ('test_event_3', '爸爸体检', '年度健康检查', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '2 hours', false, 'HEALTH', 'FAMILY', 'CONFIRMED', NOW(), NOW(), 'test_family_1', 'test_user_1', 'test_user_1'),
  ('test_event_4', '结婚纪念日', '庆祝结婚10周年', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days', true, 'ANNIVERSARY', 'FAMILY', 'CONFIRMED', NOW(), NOW(), 'test_family_1', 'test_user_1', NULL)
ON CONFLICT (id) DO NOTHING;

-- 添加事件提醒
INSERT INTO event_reminders (id, type, "beforeMinutes", "scheduledAt", "sentAt", "createdAt", "eventId")
SELECT
  'test_reminder_' || e.id,
  'BEFORE',
  1440,
  e."startTime" - INTERVAL '1 day',
  NULL,
  NOW(),
  e.id
FROM events e
WHERE e.id LIKE 'test_event_%'
ON CONFLICT (id) DO NOTHING;

EOF

echo "✅ 测试数据初始化完成！"
echo ""
echo "📊 测试数据概览："
echo "  - 4个测试用户（爸爸、妈妈、小明、小红）"
echo "  - 1个测试家庭（温馨之家）"
echo "  - 4个测试事件（生日、野餐、体检、纪念日）"
echo "  - 邀请码: TEST1234"
echo ""
echo "🔑 测试账号："
echo "  - openid: test_openid_1 (爸爸)"
echo "  - openid: test_openid_2 (妈妈)"
echo "  - openid: test_openid_3 (小明)"
echo "  - openid: test_openid_4 (小红)"
