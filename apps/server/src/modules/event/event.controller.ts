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
import { IsString, IsBoolean, IsOptional, IsEnum, IsArray } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { EventService } from './event.service';
import { EventCategory, Visibility } from '@prisma/client';
import { FamilyMemberGuard } from '../../guards/family-member.guard';
import { FamilyMember } from '../../decorators/family-member.decorator';

class CreateEventDto {
  @IsString()
  familyId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  startTime: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  isAllDay: boolean;

  @IsEnum(EventCategory)
  category: EventCategory;

  @IsEnum(Visibility)
  visibility: Visibility;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsOptional()
  recurrence?: any;

  @IsArray()
  reminders: Array<{ type: string; beforeMinutes?: number }>;
}

class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsEnum(EventCategory)
  @IsOptional()
  category?: EventCategory;

  @IsEnum(Visibility)
  @IsOptional()
  visibility?: Visibility;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsOptional()
  recurrence?: any;
}

class QueryEventsDto {
  @IsString()
  familyId: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsString()
  @IsOptional()
  status?: string;
}

@Controller()
@UseGuards(AuthGuard('jwt'))
export class EventController {
  constructor(private eventService: EventService) {}

  @Post('event')
  @UseGuards(FamilyMemberGuard)
  async create(
    @Request() req: any,
    @Body() dto: CreateEventDto,
    @FamilyMember() member: any,
  ) {
    const event = await this.eventService.create(req.user.id, dto);
    return {
      code: 0,
      message: 'success',
      data: event,
    };
  }

  @Get('events')
  @UseGuards(FamilyMemberGuard)
  async findAll(
    @Request() req: any,
    @Query() query: QueryEventsDto,
    @FamilyMember() member: any,
  ) {
    const events = await this.eventService.findByDateRange(
      req.user.id,
      query.familyId,
      query.startDate,
      query.endDate,
    );
    return {
      code: 0,
      message: 'success',
      data: events,
    };
  }

  @Get('events/pending')
  @UseGuards(FamilyMemberGuard)
  async getPending(
    @Request() req: any,
    @Query('familyId') familyId: string,
    @FamilyMember() member: any,
  ) {
    const events = await this.eventService.getPendingEvents(
      req.user.id,
      familyId,
    );
    return {
      code: 0,
      message: 'success',
      data: events,
    };
  }

  @Get('event/:id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const event = await this.eventService.findById(req.user.id, id);
    return {
      code: 0,
      message: 'success',
      data: event,
    };
  }

  @Put('event/:id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    const event = await this.eventService.update(req.user.id, id, dto);
    return {
      code: 0,
      message: 'success',
      data: event,
    };
  }

  @Delete('event/:id')
  async delete(@Request() req: any, @Param('id') id: string) {
    await this.eventService.delete(req.user.id, id);
    return {
      code: 0,
      message: 'success',
    };
  }

  @Post('event/:id/accept')
  async accept(@Request() req: any, @Param('id') id: string) {
    const event = await this.eventService.accept(req.user.id, id);
    return {
      code: 0,
      message: 'success',
      data: event,
    };
  }

  @Post('event/:id/reject')
  async reject(@Request() req: any, @Param('id') id: string) {
    const event = await this.eventService.reject(req.user.id, id);
    return {
      code: 0,
      message: 'success',
      data: event,
    };
  }
}
