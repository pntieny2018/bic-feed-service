import { Controller, Get, Logger, Post, Version } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserFollowGroupCommand } from '../../application/command/worker/user-follow-group';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { UserUnfollowGroupCommand } from '../../application/command/worker/user-unfollow-group';
import { AuthUser } from '../../../../common/decorators';
import { UserDto } from '@libs/service/user';
import { EventPatternAndLog } from '@libs/infra/log';
import { IKafkaConsumeMessage } from '@libs/infra/kafka';

@Controller()
export class FollowConsumer {
  private _logger = new Logger(FollowConsumer.name);

  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @EventPatternAndLog(KAFKA_TOPIC.BEIN_GROUP.USERS_FOLLOW_GROUPS)
  public async follow(
    message: IKafkaConsumeMessage<{
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
