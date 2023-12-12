import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { Inject } from '@nestjs/common';

import { IKafkaAdapter, KAFKA_ADAPTER } from '../infra-adapter-interface';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';

import { DispatchContentsInGroupsToUserIdProps, INewsfeedDomainService } from './interface';

export class NewsfeedDomainService implements INewsfeedDomainService {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

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
