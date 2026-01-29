import { Controller, Post, Request } from '@nestjs/common';
import { FamilyService } from '../family/family.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('debug')
export class DebugController {
  constructor(
    private familyService: FamilyService,
    private prisma: PrismaService,
  ) {}

  @Post('join-family')
  async joinFamily(@CurrentUser() user: any) {
    const userId = user.id;

    const families = await this.prisma.family.findFirst({
      orderBy: { createdAt: 'asc' },
      include: { members: true }
    });

    if (!families) {
      return {
        code: 0,
        message: '没有家庭，请先创建',
        data: null
      };
    }

    const existingMember = families.members.find(m => m.userId === userId);
    if (existingMember) {
      return {
        code: 0,
        message: '已加入家庭',
        data: {
          family: {
            id: families.id,
            name: families.name
          }
        }
      };
    }

    const inviteCode = families.inviteCode;
    await this.familyService.joinByInviteCode(userId, inviteCode, '测试成员');

    return {
      code: 0,
      message: '已自动加入家庭',
      data: {
        family: {
          id: families.id,
          name: families.name
        }
      }
    };
  }
}
