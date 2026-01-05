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
import { EventService } from './event.service';
import { EventCategory, Visibility } from '@prisma/client';

class CreateEventDto {
  familyId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  isAllDay: boolean;
  category: EventCategory;
  visibility: Visibility;
  assigneeId?: string;
  recurrence?: object;
  reminders: Array<{ type: string; beforeMinutes?: number }>;
}

class UpdateEventDto {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  category?: EventCategory;
  visibility?: Visibility;
  recurrence?: object;
}

class QueryEventsDto {
  familyId: string;
  startDate: string;
  endDate: string;
}

@Controller()
@UseGuards(AuthGuard('jwt'))
export class EventController {
  constructor(private eventService: EventService) {}

  @Post('event')
  async create(@Request() req, @Body() dto: CreateEventDto) {
    const event = await this.eventService.create(req.user.id, dto);
    return {
      code: 0,
      message: 'success',
      data: event,
    };
  }

  @Get('events')
  async findAll(@Request() req, @Query() query: QueryEventsDto) {
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
  async getPending(@Request() req, @Query('familyId') familyId: string) {
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
  async findOne(@Request() req, @Param('id') id: string) {
    const event = await this.eventService.findById(req.user.id, id);
    return {
      code: 0,
      message: 'success',
      data: event,
    };
  }

  @Put('event/:id')
  async update(
    @Request() req,
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
  async delete(@Request() req, @Param('id') id: string) {
    await this.eventService.delete(req.user.id, id);
    return {
      code: 0,
      message: 'success',
    };
  }

  @Post('event/:id/accept')
  async accept(@Request() req, @Param('id') id: string) {
    const event = await this.eventService.accept(req.user.id, id);
    return {
      code: 0,
      message: 'success',
      data: event,
    };
  }

  @Post('event/:id/reject')
  async reject(@Request() req, @Param('id') id: string) {
    const event = await this.eventService.reject(req.user.id, id);
    return {
      code: 0,
      message: 'success',
      data: event,
    };
  }
}
