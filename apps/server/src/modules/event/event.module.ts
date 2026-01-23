import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { RecurrenceService } from './recurrence.service';

@Module({
  controllers: [EventController],
  providers: [EventService, RecurrenceService],
  exports: [EventService],
})
export class EventModule {}
