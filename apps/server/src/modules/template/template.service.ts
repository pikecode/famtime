import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventCategory, Visibility } from '@prisma/client';

interface CreateTemplateDto {
  familyId: string;
  name: string;
  title: string;
  description?: string;
  duration?: number;
  isAllDay: boolean;
  category: EventCategory;
  visibility: Visibility;
  reminders: Array<{ type: string; beforeMinutes?: number }>;
  isPublic: boolean;
}

interface UpdateTemplateDto extends Partial<CreateTemplateDto> {}

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  // 创建模板
  async create(userId: string, dto: CreateTemplateDto) {
    // 验证用户是否是家庭成员
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId: dto.familyId },
    });

    if (!member) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    return this.prisma.eventTemplate.create({
      data: {
        familyId: dto.familyId,
        creatorId: userId,
        name: dto.name,
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        isAllDay: dto.isAllDay,
        category: dto.category,
        visibility: dto.visibility,
        reminders: dto.reminders,
        isPublic: dto.isPublic,
      },
      include: {
        creator: { select: { id: true, nickname: true } },
      },
    });
  }

  // 获取模板列表
  async findAll(userId: string, familyId: string) {
    // 验证用户是否是家庭成员
    const member = await this.prisma.familyMember.findFirst({
      where: { userId, familyId },
    });

    if (!member) {
      throw new ForbiddenException('您不是该家庭成员');
    }

    // 返回公开模板和自己创建的私有模板
    return this.prisma.eventTemplate.findMany({
      where: {
        familyId,
        OR: [
          { isPublic: true },
          { creatorId: userId },
        ],
      },
      include: {
        creator: { select: { id: true, nickname: true } },
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // 获取模板详情
  async findById(userId: string, templateId: string) {
    const template = await this.prisma.eventTemplate.findUnique({
      where: { id: templateId },
      include: {
        creator: { select: { id: true, nickname: true } },
      },
    });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    // 验证权限
    if (!template.isPublic && template.creatorId !== userId) {
      throw new ForbiddenException('无权访问此模板');
    }

    return template;
  }

  // 更新模板
  async update(userId: string, templateId: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.eventTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    // 只有创建者可以修改
    if (template.creatorId !== userId) {
      throw new ForbiddenException('只有创建者可以修改模板');
    }

    return this.prisma.eventTemplate.update({
      where: { id: templateId },
      data: {
        name: dto.name,
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        isAllDay: dto.isAllDay,
        category: dto.category,
        visibility: dto.visibility,
        reminders: dto.reminders,
        isPublic: dto.isPublic,
      },
      include: {
        creator: { select: { id: true, nickname: true } },
      },
    });
  }

  // 删除模板
  async delete(userId: string, templateId: string) {
    const template = await this.prisma.eventTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    // 只有创建者可以删除
    if (template.creatorId !== userId) {
      throw new ForbiddenException('只有创建者可以删除模板');
    }

    await this.prisma.eventTemplate.delete({
      where: { id: templateId },
    });

    return { success: true };
  }

  // 使用模板（增加使用次数）
  async useTemplate(userId: string, templateId: string) {
    const template = await this.findById(userId, templateId);

    await this.prisma.eventTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return template;
  }
}
