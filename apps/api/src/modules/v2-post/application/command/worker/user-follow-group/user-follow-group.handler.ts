import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  FOLLOW_REPOSITORY_TOKEN,
  IFollowRepository,
} from '../../../../domain/repositoty-interface';
import { UserFollowGroupCommand } from './user-follow-group.command';
import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface/newsfeed.domain-service.interface';

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
    const attachGroupIds = await this._getGroupIdsUserNeedFollowed(userId, groupIds);
    if (attachGroupIds.length === 0) {
      return;
    }

    await this._followRepo.bulkCreate(attachGroupIds.map((groupId) => ({ userId, groupId })));

    await this._newsfeedDomainService.dispatchContentsInGroupsToUserId({
      groupIds: attachGroupIds,
      userId,
      action: 'publish',
    });
  }

  private async _getGroupIdsUserNeedFollowed(
    userId: string,
    groupIds: string[]
  ): Promise<string[]> {
    const groupIdsUserFollowed = await this._followRepo.findGroupIdsUserFollowed(userId);

    const currentGroupIds = new Set(groupIdsUserFollowed);
    return groupIds.filter((groupId) => !currentGroupIds.has(groupId));
  }
}
