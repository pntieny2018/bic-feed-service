import { IKafkaConsumeMessage } from '@libs/infra/kafka';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { ProcessGroupPrivacyUpdatedCommand } from '../../application/command/content';
import { ProcessGroupStateUpdatedCommand } from '../../application/command/content/process-group-state-updated';
import {
  GroupPrivacyUpdatedMessagePayload,
  GroupStateUpdatedMessagePayload,
} from '../../application/dto/message';

@Controller()
export class GroupConsumer {
  private readonly _logger = new Logger(GroupConsumer.name);

  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_GROUP.UPDATED_PRIVACY_GROUP)
  public async groupPrivacyUpdated(
    message: IKafkaConsumeMessage<GroupPrivacyUpdatedMessagePayload>
  ): Promise<void> {
    const { value } = message;
    await this._commandBus.execute<ProcessGroupPrivacyUpdatedCommand, void>(
      new ProcessGroupPrivacyUpdatedCommand(value)
    );
  }

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_GROUP.GROUP_STATE_HAS_BEEN_CHANGED)
  public async groupStateUpdated(
    message: IKafkaConsumeMessage<GroupStateUpdatedMessagePayload>
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
