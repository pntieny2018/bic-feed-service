import { IKafkaConsumerMessage } from '@libs/infra/kafka';
import { EventPatternAndLog } from '@libs/infra/log';
import { Controller } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { UserFollowGroupCommand } from '../../application/command/worker/user-follow-group';
import { UserUnfollowGroupCommand } from '../../application/command/worker/user-unfollow-group';

@Controller()
export class FollowConsumer {
  public constructor(private readonly _commandBus: CommandBus) {}

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_GROUP.USERS_FOLLOW_GROUPS)
  public async follow(
    message: IKafkaConsumerMessage<{
      userId: string;
      groupIds: string[];
      verb: 'FOLLOW' | 'UNFOLLOW';
    }>
  ): Promise<void> {
    const { userId, groupIds, verb } = message.value;
    if (verb === 'FOLLOW') {
      await this._commandBus.execute<UserFollowGroupCommand>(
        new UserFollowGroupCommand({ userId, groupIds })
      );
    }

    if (verb === 'UNFOLLOW') {
      await this._commandBus.execute<UserUnfollowGroupCommand>(
        new UserUnfollowGroupCommand({ userId, groupIds })
      );
    }
  }
}