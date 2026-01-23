import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { RecurrenceService } from './recurrence.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  controllers: [EventController, CommentController],
  providers: [EventService, RecurrenceService, CommentService],
  exports: [EventService],
})
export class EventModule {}
