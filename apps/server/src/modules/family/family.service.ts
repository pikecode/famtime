import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole } from '@prisma/client';
import { AchievementService } from '../achievement/achievement.service';

@Injectable()
export class FamilyService {
  constructor(
    private prisma: PrismaService,
    private achievementService: AchievementService,
  ) {}

  // 生成邀请码
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // 创建家庭
  async create(userId: string, name: string, avatar?: string) {
    // 检查用户是否已有家庭
    const existingMember = await this.prisma.familyMember.findFirst({
      where: { userId },
    });

    if (existingMember) {
      throw new ConflictException('您已加入一个家庭，请先退出');
    }

    const inviteCode = this.generateInviteCode();

    // 创建家庭和成员
    const family = await this.prisma.family.create({
      data: {
        name,
        avatar,
        inviteCode,
        creatorId: userId,
        adminId: userId,
        members: {
          create: {
            userId,
            nickname: '创建者',
            role: MemberRole.ADMIN,
            color: '#339AF0',
          },
        },
      },
      include: {
        members: true,
      },
    });

    // 检查成就
    await this.achievementService.checkAchievement(userId, 'FAMILY_CREATED');

    return family;
  }

  // 获取家庭信息
  async findById(id: string) {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!family) {
      throw new NotFoundException('家庭不存在');
    }

    return family;
  }

  // 通过邀请码加入家庭
  async joinByInviteCode(userId: string, inviteCode: string, nickname: string) {
    const family = await this.prisma.family.findUnique({
      where: { inviteCode },
    });

    if (!family) {
      throw new NotFoundException('邀请码无效');
    }

    // 检查是否已加入
    const existingMember = await this.prisma.familyMember.findFirst({
      where: { userId },
    });

    if (existingMember) {
      if (existingMember.familyId === family.id) {
        throw new ConflictException('您已是该家庭成员');
      }
      throw new ConflictException('您已加入其他家庭，请先退出');
    }

    // 检查家庭人数上限
    const memberCount = await this.prisma.familyMember.count({
      where: { familyId: family.id },
    });

    if (memberCount >= 8) {
      throw new ForbiddenException('该家庭已达人数上限');
    }

    // 分配颜色
    const colors = ['#FF6B6B', '#51CF66', '#FFD43B', '#339AF0', '#FF85A2', '#ADB5BD', '#845EF7', '#20C997'];
    const usedColors = await this.prisma.familyMember.findMany({
      where: { familyId: family.id },
      select: { color: true },
    });
    const usedColorSet = new Set(usedColors.map((m) => m.color));
    const availableColor = colors.find((c) => !usedColorSet.has(c)) || colors[0];

    const member = await this.prisma.familyMember.create({
      data: {
        familyId: family.id,
        userId,
        nickname,
        role: MemberRole.MEMBER,
        color: availableColor,
      },
    });

    // 检查邀请成就（给邀请人）
    await this.achievementService.checkAchievement(family.adminId, 'MEMBER_INVITED');

    return member;
  }

  // 退出家庭
  async leave(userId: string, familyId: string) {
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId },
    });

    if (!member) {
      throw new NotFoundException('您不是该家庭成员');
    }

    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
    });

    // 如果是管理员，需要转让或解散
    if (family?.adminId === userId) {
      const otherMembers = await this.prisma.familyMember.findMany({
        where: { familyId, userId: { not: userId } },
      });

      if (otherMembers.length > 0) {
        throw new ForbiddenException('请先将管理权转让给其他成员');
      }

      // 无其他成员，解散家庭
      await this.prisma.family.delete({
        where: { id: familyId },
      });
    } else {
      // 普通成员直接退出
      await this.prisma.familyMember.delete({
        where: { id: member.id },
      });
    }

    return { success: true };
  }

  // 刷新邀请码
  async refreshInviteCode(userId: string, familyId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException('家庭不存在');
    }

    if (family.adminId !== userId) {
      throw new ForbiddenException('只有管理员可以刷新邀请码');
    }

    const newCode = this.generateInviteCode();

    await this.prisma.family.update({
      where: { id: familyId },
      data: { inviteCode: newCode },
    });

    return { inviteCode: newCode };
  }

  // 获取用户的家庭（返回所有家庭）
  async getUserFamily(userId: string) {
    console.log('[FamilyService] getUserFamily called for userId:', userId);
    const members = await this.prisma.familyMember.findMany({
      where: { userId },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            avatar: true,
            inviteCode: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc', // 按加入时间排序，最早加入的在前
      },
    });

    console.log('[FamilyService] Found members:', members.length);
    console.log('[FamilyService] Members data:', JSON.stringify(members, null, 2));

    // 返回家庭列表
    const families = members.map(m => m.family);
    console.log('[FamilyService] Returning families:', JSON.stringify(families, null, 2));
    return families;
  }
}
