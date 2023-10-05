import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { EVENT_SERVICE_TOKEN } from './event.interface';
import { EventService } from './event.service';

@Module({
  imports: [CqrsModule],
  providers: [{ provide: EVENT_SERVICE_TOKEN, useClass: EventService }],
  exports: [EVENT_SERVICE_TOKEN],
})
export class EventModule {}
