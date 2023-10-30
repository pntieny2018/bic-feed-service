import { IKafkaConsumeMessage } from '@libs/infra/kafka';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { ProcessGroupPrivacyUpdatedCommand } from '../../application/command/content';
import { GroupPrivacyUpdatedMessagePayload } from '../../application/dto/message';

@Controller()
export class PostConsumer {
  private readonly _logger = new Logger(PostConsumer.name);

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
}
