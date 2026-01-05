import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole } from '@prisma/client';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  // 获取家庭成员列表
  async getFamilyMembers(familyId: string) {
    return this.prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // 更新成员信息
  async updateMember(
    userId: string,
    memberId: string,
    data: { nickname?: string; color?: string },
  ) {
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    // 只能修改自己或管理员可以修改其他人
    if (member.userId !== userId) {
      const currentMember = await this.prisma.familyMember.findFirst({
        where: { userId, familyId: member.familyId },
      });

      if (currentMember?.role !== MemberRole.ADMIN) {
        throw new ForbiddenException('无权修改其他成员信息');
      }
    }

    return this.prisma.familyMember.update({
      where: { id: memberId },
      data,
    });
  }

  // 移除成员（仅管理员）
  async removeMember(userId: string, memberId: string) {
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
      include: { family: true },
    });

    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    // 检查操作者是否是管理员
    const currentMember = await this.prisma.familyMember.findFirst({
      where: { userId, familyId: member.familyId },
    });

    if (currentMember?.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('只有管理员可以移除成员');
    }

    // 不能移除管理员自己
    if (member.userId === userId) {
      throw new ForbiddenException('管理员不能移除自己');
    }

    await this.prisma.familyMember.delete({
      where: { id: memberId },
    });

    return { success: true };
  }

  // 转让管理权
  async transferAdmin(userId: string, familyId: string, newAdminUserId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) {
      throw new NotFoundException('家庭不存在');
    }

    if (family.adminId !== userId) {
      throw new ForbiddenException('只有管理员可以转让管理权');
    }

    const newAdmin = await this.prisma.familyMember.findFirst({
      where: { familyId, userId: newAdminUserId },
    });

    if (!newAdmin) {
      throw new NotFoundException('目标用户不是家庭成员');
    }

    // 更新家庭管理员
    await this.prisma.family.update({
      where: { id: familyId },
      data: { adminId: newAdminUserId },
    });

    // 更新成员角色
    await this.prisma.$transaction([
      this.prisma.familyMember.updateMany({
        where: { familyId, userId },
        data: { role: MemberRole.MEMBER },
      }),
      this.prisma.familyMember.updateMany({
        where: { familyId, userId: newAdminUserId },
        data: { role: MemberRole.ADMIN },
      }),
    ]);

    return { success: true };
  }
}
