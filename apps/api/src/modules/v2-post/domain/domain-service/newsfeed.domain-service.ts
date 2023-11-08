import { Inject, Logger } from '@nestjs/common';
import { ArrayHelper } from 'apps/api/src/common/helpers';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../infra-adapter-interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  FOLLOW_REPOSITORY_TOKEN,
  IContentRepository,
  IFollowRepository,
} from '../repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../service-adapter-interface';

import {
  DispatchContentIdToGroupsProps,
  DispatchContentsInGroupsToUserIdProps,
  INewsfeedDomainService,
} from './interface/newsfeed.domain-service.interface';

export class NewsfeedDomainService implements INewsfeedDomainService {
  private readonly _logger = new Logger(NewsfeedDomainService.name);

  public constructor(
    @Inject(FOLLOW_REPOSITORY_TOKEN)
    private readonly _followRepo: IFollowRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async dispatchContentIdToGroups(input: DispatchContentIdToGroupsProps): Promise<void> {
    const { contentId, newGroupIds, oldGroupIds } = input;

    const attachedGroupIds = ArrayHelper.arrDifferenceElements(newGroupIds, oldGroupIds);
    const detachedGroupIds = ArrayHelper.arrDifferenceElements(oldGroupIds, newGroupIds);

    if (attachedGroupIds.length) {
      let latestFollowId = 0;
      while (true) {
        const { userIds, latestFollowId: lastId } =
          await this._followRepo.findUsersFollowedGroupIds({
            groupIds: newGroupIds,
            notExistInGroupIds: [],
            zindex: latestFollowId,
            limit: 1000,
          });
        if (userIds.length) {
          await this._kafkaAdapter.sendMessages(
            KAFKA_TOPIC.CONTENT.PUBLISH_OR_REMOVE_TO_NEWSFEED,
            userIds.map((userId) => ({
              key: userId,
              value: {
                contentId: contentId,
                userId,
                action: 'publish',
              },
            }))
          );
        }
        if (userIds.length === 0 || userIds.length < 1000) {
          break;
        }
        latestFollowId = lastId;
      }
    }

    if (detachedGroupIds.length) {
      let latestFollowId = 0;
      while (true) {
        const { userIds, latestFollowId: lastId } =
          await this._followRepo.findUsersFollowedGroupIds({
            groupIds: detachedGroupIds,
            notExistInGroupIds: newGroupIds,
            zindex: latestFollowId,
            limit: 1000,
          });
        if (userIds.length) {
          await this._kafkaAdapter.sendMessages(
            KAFKA_TOPIC.CONTENT.PUBLISH_OR_REMOVE_TO_NEWSFEED,
            userIds.map((userId) => ({
              key: userId,
              value: {
                contentId: contentId,
                userId,
                action: 'remove',
              },
            }))
          );
        }
        if (userIds.length === 0 || userIds.length < 1000) {
          break;
        }
        latestFollowId = lastId;
      }
    }
  }

  public async dispatchContentsInGroupsToUserId(
    input: DispatchContentsInGroupsToUserIdProps
  ): Promise<void> {
    const { userId, groupIds, action } = input;
    let after = null;
    while (true) {
      const contents = await this._contentRepo.getCursorPaginationPostIdsPublishedInGroup({
        groupIds,
        limit: 1000,
        after,
      });
      if (!contents.ids.length) {
        break;
      }

      await this._kafkaAdapter.sendMessages(
        KAFKA_TOPIC.CONTENT.PUBLISH_OR_REMOVE_TO_NEWSFEED,
        contents.ids.map((contentId) => ({
          key: userId,
          value: {
            contentId,
            userId,
            action,
          },
        }))
      );
      after = contents.cursor;
    }
  }
}
