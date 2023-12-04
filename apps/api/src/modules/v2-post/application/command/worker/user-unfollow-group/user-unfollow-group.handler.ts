import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  FOLLOW_REPOSITORY_TOKEN,
  IFollowRepository,
} from '../../../../domain/repositoty-interface';
import { UserUnfollowGroupCommand } from './user-unfollow-group.command';
import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface/newsfeed.domain-service.interface';

@CommandHandler(UserUnfollowGroupCommand)
export class UserUnfollowGroupHandler implements ICommandHandler<UserUnfollowGroupCommand, void> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService,

    @Inject(FOLLOW_REPOSITORY_TOKEN)
    private readonly _followRepo: IFollowRepository
  ) {}

  public async execute(command: UserUnfollowGroupCommand): Promise<void> {
    const { userId, groupIds } = command.payload;

    await this._followRepo.deleteByUserIdAndGroupIds(userId, groupIds);

    await this._newsfeedDomainService.dispatchContentsInGroupsToUserId({
      groupIds,
      userId,
      action: 'remove',
    });
  }
}
