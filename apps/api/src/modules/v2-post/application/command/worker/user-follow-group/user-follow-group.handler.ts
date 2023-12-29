import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface/newsfeed.domain-service.interface';
import {
  FOLLOW_REPOSITORY_TOKEN,
  IFollowRepository,
} from '../../../../domain/repositoty-interface';

import { UserFollowGroupCommand } from './user-follow-group.command';

@CommandHandler(UserFollowGroupCommand)
export class UserFollowGroupHandler implements ICommandHandler<UserFollowGroupCommand, void> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService,

    @Inject(FOLLOW_REPOSITORY_TOKEN)
    private readonly _followRepo: IFollowRepository
  ) {}

  public async execute(command: UserFollowGroupCommand): Promise<void> {
    const { userId, groupIds } = command.payload;
    if (groupIds.length === 0) {
      return;
    }

    await this._followRepo.bulkCreate(groupIds.map((groupId) => ({ userId, groupId })));

    await this._newsfeedDomainService.dispatchContentsInGroupsToUserId({
      groupIds,
      userId,
      action: 'publish',
    });
  }
}
