import { Inject, Logger } from '@nestjs/common';
import { ArrayHelper } from 'apps/api/src/common/helpers';
import { FOLLOW_REPOSITORY_TOKEN, IFollowRepository } from '../repositoty-interface';
import {
  DispatchNewsfeedProps,
  INewsfeedDomainService,
} from './interface/newsfeed.domain-service.interface';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../infra-adapter-interface';
import { KAFKA_TOPIC } from '../../../../common/constants';

export class NewsfeedDomainService implements INewsfeedDomainService {
  private readonly _logger = new Logger(NewsfeedDomainService.name);

  public constructor(
    @Inject(FOLLOW_REPOSITORY_TOKEN)
    private readonly _followRepository: IFollowRepository,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async dispatchNewsfeed(input: DispatchNewsfeedProps): Promise<void> {
    const { contentId, newGroupIds, oldGroupIds } = input;

    const attachedGroupIds = ArrayHelper.arrDifferenceElements(newGroupIds, oldGroupIds);
    const detachedGroupIds = ArrayHelper.arrDifferenceElements(oldGroupIds, newGroupIds);

    if (attachedGroupIds.length) {
      let latestFollowId = 0;
      while (true) {
        const { userIds, latestFollowId: lastId } =
          await this._followRepository.getUserFollowGroupIds({
            groupIds: newGroupIds,
            notExistInGroupIds: [],
            zindex: latestFollowId,
            limit: 1000,
          });
        if (userIds.length) {
          await this._kafkaAdapter.sendMessages(
            KAFKA_TOPIC.CONTENT.PUBLISH_OR_REMOVE_TO_NEWSFEED,
            userIds.map((userId) => ({
              key: contentId,
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
          await this._followRepository.getUserFollowGroupIds({
            groupIds: detachedGroupIds,
            notExistInGroupIds: newGroupIds,
            zindex: latestFollowId,
            limit: 1000,
          });
        if (userIds.length) {
          await this._kafkaAdapter.sendMessages(
            KAFKA_TOPIC.CONTENT.PUBLISH_OR_REMOVE_TO_NEWSFEED,
            userIds.map((userId) => ({
              key: contentId,
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
}
