import { Traceable } from '@libs/common/modules/opentelemetry';
import { IKafkaConsumerMessage, KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Payload } from '@nestjs/microservices';

import { UserFollowGroupCommand } from '../../application/command/user-follow-group';
import { UserUnfollowGroupCommand } from '../../application/command/user-unfollow-group';
import { FollowAction } from '../../data-type';

@Controller()
@Traceable()
export class FollowConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_GROUP.USERS_FOLLOW_GROUPS)
  public async follow(
    @Payload()
    message: IKafkaConsumerMessage<{
      userId: string;
      groupIds: string[];
      verb: FollowAction;
    }>
  ): Promise<void> {
    const { userId, groupIds, verb } = message.value;
    if (verb === FollowAction.FOLLOW) {
      return this._commandBus.execute<UserFollowGroupCommand>(
        new UserFollowGroupCommand({ userId, groupIds })
      );
    }

    if (verb === FollowAction.UNFOLLOW) {
      return this._commandBus.execute<UserUnfollowGroupCommand>(
        new UserUnfollowGroupCommand({ userId, groupIds })
      );
    }
  }
}
