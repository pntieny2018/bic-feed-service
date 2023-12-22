import { ProcessGroupPrivacyUpdatedCommand } from '@api/modules/v2-post/application/command/content';
import { ProcessGroupStateUpdatedCommand } from '@api/modules/v2-post/application/command/content/process-group-state-updated';
import {
  GroupPrivacyUpdatedMessagePayload,
  GroupStateUpdatedMessagePayload,
} from '@api/modules/v2-post/application/dto/message';
import { IKafkaConsumerMessage, KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Payload } from '@nestjs/microservices';

/**
 * TODO: Move commands to worker folder
 */
@Controller()
export class GroupConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_GROUP.UPDATED_PRIVACY_GROUP)
  public async groupPrivacyUpdated(
    @Payload()
    message: IKafkaConsumerMessage<GroupPrivacyUpdatedMessagePayload>
  ): Promise<void> {
    const { value } = message;
    return this._commandBus.execute<ProcessGroupPrivacyUpdatedCommand, void>(
      new ProcessGroupPrivacyUpdatedCommand(value)
    );
  }

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_GROUP.GROUP_STATE_HAS_BEEN_CHANGED)
  public async groupStateUpdated(
    @Payload()
    message: IKafkaConsumerMessage<GroupStateUpdatedMessagePayload>
  ): Promise<void> {
    const { data } = message.value;
    return this._commandBus.execute<ProcessGroupStateUpdatedCommand, void>(
      new ProcessGroupStateUpdatedCommand({
        groupIds: data.object.groups.map((group) => group.id),
        verb: data.verb,
      })
    );
  }
}
