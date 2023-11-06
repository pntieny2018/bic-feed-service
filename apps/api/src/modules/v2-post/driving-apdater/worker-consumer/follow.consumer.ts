import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserFollowGroupCommand } from '../../application/command/worker/user-follow-group';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { UserUnfollowGroupCommand } from '../../application/command/worker/user-unfollow-group';

@Controller()
export class FollowConsumer {
  private _logger = new Logger(FollowConsumer.name);

  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @EventPattern(KAFKA_TOPIC.BEIN_GROUP.USERS_FOLLOW_GROUPS)
  public async follow(
    @Payload('value') payload: { userId: string; groupIds: string[]; verb: 'FOLLOW' | 'UNFOLLOW' }
  ): Promise<void> {
    this._logger.debug(`[Event follow/unfollow]: ${JSON.stringify(payload)}`);
    const { userId, groupIds, verb } = payload;
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
