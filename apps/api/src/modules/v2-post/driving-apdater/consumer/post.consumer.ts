import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EventPattern, Payload } from '@nestjs/microservices';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { ProcessGroupPrivacyUpdatedCommand } from '../../application/command/content';
import { GroupPrivacyUpdatedMessagePayload } from '../../application/dto/message';

@Controller()
export class PostConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPattern(KAFKA_TOPIC.BEIN_GROUP.UPDATED_PRIVACY_GROUP)
  public async groupPrivacyUpdated(
    @Payload('value') payload: GroupPrivacyUpdatedMessagePayload
  ): Promise<void> {
    await this._commandBus.execute<ProcessGroupPrivacyUpdatedCommand, void>(
      new ProcessGroupPrivacyUpdatedCommand(payload)
    );
  }
}
