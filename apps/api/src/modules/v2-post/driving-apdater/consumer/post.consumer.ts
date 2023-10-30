import { Controller, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { ProcessGroupPrivacyUpdatedCommand } from '../../application/command/content';
import { GroupPrivacyUpdatedMessagePayload } from '../../application/dto/message';

@Controller()
export class PostConsumer {
  private readonly _logger = new Logger(PostConsumer.name);

  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPattern(KAFKA_TOPIC.BEIN_GROUP.UPDATED_PRIVACY_GROUP)
  public async groupPrivacyUpdated(
    @Payload('topic') topic: string,
    @Payload('value') payload: GroupPrivacyUpdatedMessagePayload
  ): Promise<void> {
    this._logger.debug(`Received message: ${JSON.stringify(payload)} from topic: ${topic}`);

    await this._commandBus.execute<ProcessGroupPrivacyUpdatedCommand, void>(
      new ProcessGroupPrivacyUpdatedCommand(payload)
    );
  }
}
