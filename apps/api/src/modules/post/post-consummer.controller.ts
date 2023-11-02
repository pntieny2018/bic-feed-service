import { Controller, Logger } from '@nestjs/common';

import { InternalEventEmitterService } from '../../app/custom/event-emitter';

@Controller()
export class PostConsumerController {
  private _logger = new Logger(PostConsumerController.name);
  public constructor(private _eventEmitter: InternalEventEmitterService) {}
}
