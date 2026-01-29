import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 家庭成员权限守卫
 * 验证用户是否是指定家庭的成员
 */
@Injectable()
export class FamilyMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未登录');
    }

    // 从请求中获取 familyId（支持多种来源）
    const familyId =
      request.params.familyId ||
      request.query.familyId ||
      request.body.familyId;

    if (!familyId) {
      throw new BadRequestException('缺少家庭ID参数');
    }

    // 检查用户是否是家庭成员
    const member = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId: user.id,
        },
      },
      include: {
        family: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('您不是该家庭成员，请先加入家庭');
    }

    // 将成员信息附加到请求对象，供后续使用
    request.familyMember = member;
    request.family = member.family;

    return true;
  }
}
