import { ArrayHelper } from '@libs/common/helpers';
import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { Inject, Logger } from '@nestjs/common';

import { IKafkaAdapter, KAFKA_ADAPTER } from '../infra-adapter-interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';

import {
  DispatchContentIdToGroupsProps,
  DispatchContentsInGroupsToUserIdProps,
  GetContentIdsInNewsFeedProps,
  INewsfeedDomainService,
} from './interface';
import { CursorPaginationResult } from '@libs/database/postgres/common';

export class NewsfeedDomainService implements INewsfeedDomainService {
  private readonly _logger = new Logger(NewsfeedDomainService.name);

  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async dispatchContentIdToGroups(input: DispatchContentIdToGroupsProps): Promise<void> {
    const { contentId, newGroupIds, oldGroupIds } = input;

    const attachedGroupIds = ArrayHelper.arrDifferenceElements(newGroupIds, oldGroupIds);
    const detachedGroupIds = ArrayHelper.arrDifferenceElements(oldGroupIds, newGroupIds);

    if (attachedGroupIds.length) {
      let cursorPagination = null;
      while (true) {
        const { list: userIds, cursor } = await this._groupAdapter.getUserIdsInGroups({
          groupIds: attachedGroupIds,
          notInGroupIds: oldGroupIds,
          limit: 1000,
          after: cursorPagination,
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
        cursorPagination = cursor;
      }
    }

    if (detachedGroupIds.length) {
      let cursorPagination = null;
      while (true) {
        const { list: userIds, cursor } = await this._groupAdapter.getUserIdsInGroups({
          groupIds: detachedGroupIds,
          notInGroupIds: newGroupIds,
          after: cursorPagination,
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
        cursorPagination = cursor;
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

  public async getContentIdsInNewsFeed(
    props: GetContentIdsInNewsFeedProps
  ): Promise<CursorPaginationResult<string>> {
    const { isMine, type, isSaved, limit, isImportant, after, authUserId } = props;

    if (isImportant) {
      const { rows, meta } =
        await this._userNewsfeedRepo.getImportantContentIdsCursorPaginationByUserId({
          userId: authUserId,
          type,
          limit,
          after,
        });
      return {
        rows,
        meta,
      };
    }
    const { rows, meta } = await this._userNewsfeedRepo.getContentIdsCursorPaginationByUserId({
      userId: authUserId,
      isSavedBy: isSaved ? authUserId : null,
      createdBy: isMine ? authUserId : null,
      type,
      limit,
      after,
    });

    return {
      rows,
      meta,
    };
  }
}
