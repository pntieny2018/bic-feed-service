import { UserFollowGroupCommand } from '@api/modules/v2-post/application/command/worker/user-follow-group';
import { UserUnfollowGroupCommand } from '@api/modules/v2-post/application/command/worker/user-unfollow-group';
import { IKafkaConsumerMessage, KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { FollowAction } from '../data-type';

@Controller()
export class FollowConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_GROUP.USERS_FOLLOW_GROUPS)
  public async follow(
    message: IKafkaConsumerMessage<{
      userId: string;
      groupIds: string[];
      verb: FollowAction;
    }>
  ): Promise<void> {
    const { userId, groupIds, verb } = message.value;
    if (verb === FollowAction.FOLLOW) {
      await this._commandBus.execute<UserFollowGroupCommand>(
        new UserFollowGroupCommand({ userId, groupIds })
      );
    }

    if (verb === FollowAction.UNFOLLOW) {
      await this._commandBus.execute<UserUnfollowGroupCommand>(
        new UserUnfollowGroupCommand({ userId, groupIds })
      );
    }
  }
}