import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../../common/constants';
import { PostDeletedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { TagDto } from '../../dto';
import { PostChangedMessagePayload } from '../../dto/message';

@EventsHandlerAndLog(PostDeletedEvent)
export class PostDeletedEventHandler implements IEventHandler<PostDeletedEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostDeletedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (!postEntity.isPublished()) {
      return;
    }
    const postBefore = postEntity.getSnapshot();

    const payload: PostChangedMessagePayload = {
      state: 'delete',
      before: {
        id: postBefore.id,
        actor,
        setting: postBefore.setting,
        type: postBefore.type,
        groupIds: postBefore.groupIds,
        content: postBefore.content,
        mentionUserIds: postBefore.mentionUserIds,
        createdAt: postBefore.createdAt,
        updatedAt: postBefore.updatedAt,
        lang: postBefore.lang,
        isHidden: postBefore.isHidden,
        status: postBefore.status,
        seriesIds: postBefore.seriesIds,
        tags: postBefore.tags.map((tag) => new TagDto(tag.toObject())),
      },
      after: {
        id: postEntity.get('id'),
        actor: actor,
      },
    };

    await this._kafkaAdapter.emit(KAFKA_TOPIC.CONTENT.POST_CHANGED, {
      key: postEntity.getId(),
      value: new PostChangedMessagePayload(payload),
    });
  }
}
