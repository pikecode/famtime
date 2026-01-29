import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取当前请求的家庭成员信息
 * 需要配合 FamilyMemberGuard 使用
 */
export const FamilyMember = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.familyMember;
  },
);
