import { IKafkaConsumerMessage, KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { ProcessGroupPrivacyUpdatedCommand } from '../../v2-post/application/command/content';
import { ProcessGroupStateUpdatedCommand } from '../../v2-post/application/command/content/process-group-state-updated';
import {
  GroupPrivacyUpdatedMessagePayload,
  GroupStateUpdatedMessagePayload,
} from '../../v2-post/application/dto/message';

@Controller()
export class GroupConsumer {
  private readonly _logger = new Logger(GroupConsumer.name);

  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_GROUP.UPDATED_PRIVACY_GROUP)
  public async groupPrivacyUpdated(
    message: IKafkaConsumerMessage<GroupPrivacyUpdatedMessagePayload>
  ): Promise<void> {
    const { value } = message;
    await this._commandBus.execute<ProcessGroupPrivacyUpdatedCommand, void>(
      new ProcessGroupPrivacyUpdatedCommand(value)
    );
  }

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_GROUP.GROUP_STATE_HAS_BEEN_CHANGED)
  public async groupStateUpdated(
    message: IKafkaConsumerMessage<GroupStateUpdatedMessagePayload>
  ): Promise<void> {
    const { data } = message.value;
    await this._commandBus.execute<ProcessGroupStateUpdatedCommand, void>(
      new ProcessGroupStateUpdatedCommand({
        groupIds: data.object.groups.map((group) => group.id),
        verb: data.verb,
      })
    );
  }
}
