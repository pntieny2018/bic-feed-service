import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CreatedPostEvent } from '../../events/post';

@Injectable()
export class CreatedPostListener {
  private _logger = new Logger(CreatedPostListener.name);
  public constructor() {}

  @OnEvent(CreatedPostEvent.event)
  public async onPostCreated(createdPostEvent: CreatedPostEvent) {
    this._logger.debug(`Event: ${createdPostEvent}`);

    // send message to kafka

    // sync post to elastic search
  }
}
