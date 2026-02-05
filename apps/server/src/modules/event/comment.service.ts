import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AchievementService } from '../achievement/achievement.service';

interface CreateCommentDto {
  eventId: string;
  content: string;
}

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private achievementService: AchievementService,
  ) {}

  // 创建评论
  async create(userId: string, dto: CreateCommentDto) {
    // 验证事件是否存在
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { family: true },
    });

    if (!event) {
      throw new NotFoundException('事件不存在');
    }

    // 验证用户是否是家庭成员
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId: event.familyId },
    });

    if (!member) {
      throw new ForbiddenException('只有家庭成员可以评论');
    }

    // 创建评论
    const comment = await this.prisma.eventComment.create({
      data: {
        eventId: dto.eventId,
        userId,
        content: dto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    // 更新成就统计
    await this.achievementService.updateStatsOnCommentCreated(userId);
    await this.achievementService.checkAchievement(userId, 'COMMENT_CREATED');

    return comment;
  }

  // 获取事件的所有评论
  async findByEvent(userId: string, eventId: string) {
    // 验证事件是否存在
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('事件不存在');
    }

    // 验证用户是否是家庭成员
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId: event.familyId },
    });

    if (!member) {
      throw new ForbiddenException('无权查看评论');
    }

    // 获取评论列表
    const comments = await this.prisma.eventComment.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments;
  }

  // 删除评论
  async delete(userId: string, commentId: string) {
    const comment = await this.prisma.eventComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 只有评论作者可以删除
    if (comment.userId !== userId) {
      throw new ForbiddenException('只能删除自己的评论');
    }

    await this.prisma.eventComment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }
}
