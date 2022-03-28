import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InternalEventEmitterService } from './internal-event-emitter.service';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      verboseMemoryLeak: true,
    }),
  ],
  providers: [InternalEventEmitterService],
  exports: [InternalEventEmitterService],
})
export class InternalEventEmitterModule {}
