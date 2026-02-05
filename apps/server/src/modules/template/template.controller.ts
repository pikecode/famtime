import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsBoolean, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';
import { TemplateService } from './template.service';
import { EventCategory, Visibility } from '@prisma/client';
import { FamilyMemberGuard } from '../../guards/family-member.guard';
import { FamilyMember } from '../../decorators/family-member.decorator';

class CreateTemplateDto {
  @IsString()
  familyId: string;

  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsBoolean()
  isAllDay: boolean;

  @IsEnum(EventCategory)
  category: EventCategory;

  @IsEnum(Visibility)
  visibility: Visibility;

  @IsArray()
  reminders: Array<{ type: string; beforeMinutes?: number }>;

  @IsBoolean()
  isPublic: boolean;
}

class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsEnum(EventCategory)
  @IsOptional()
  category?: EventCategory;

  @IsEnum(Visibility)
  @IsOptional()
  visibility?: Visibility;

  @IsArray()
  @IsOptional()
  reminders?: Array<{ type: string; beforeMinutes?: number }>;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

@Controller('templates')
@UseGuards(AuthGuard('jwt'))
export class TemplateController {
  constructor(private templateService: TemplateService) {}

  // 创建模板
  @Post()
  @UseGuards(FamilyMemberGuard)
  async create(
    @Request() req: any,
    @Body() dto: CreateTemplateDto,
    @FamilyMember() member: any,
  ) {
    const template = await this.templateService.create(req.user.id, dto);
    return {
      code: 0,
      message: 'success',
      data: template,
    };
  }

  // 获取模板列表
  @Get()
  @UseGuards(FamilyMemberGuard)
  async findAll(
    @Request() req: any,
    @Query('familyId') familyId: string,
    @FamilyMember() member: any,
  ) {
    const templates = await this.templateService.findAll(req.user.id, familyId);
    return {
      code: 0,
      message: 'success',
      data: templates,
    };
  }

  // 获取模板详情
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const template = await this.templateService.findById(req.user.id, id);
    return {
      code: 0,
      message: 'success',
      data: template,
    };
  }

  // 更新模板
  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const template = await this.templateService.update(req.user.id, id, dto);
    return {
      code: 0,
      message: 'success',
      data: template,
    };
  }

  // 删除模板
  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    await this.templateService.delete(req.user.id, id);
    return {
      code: 0,
      message: 'success',
    };
  }

  // 使用模板
  @Post(':id/use')
  async useTemplate(@Request() req: any, @Param('id') id: string) {
    const template = await this.templateService.useTemplate(req.user.id, id);
    return {
      code: 0,
      message: 'success',
      data: template,
    };
  }
}
