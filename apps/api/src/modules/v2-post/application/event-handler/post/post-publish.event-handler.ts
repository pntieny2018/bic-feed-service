import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { KAFKA_TOPIC } from '../../../../../common/constants';
import { PostPublishedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { PostEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { FileDto, ImageDto, TagDto, VideoDto } from '../../dto';
import { PostChangedMessagePayload } from '../../dto/message';

@EventsHandlerAndLog(PostPublishedEvent)
export class PostPublishedEventHandler implements IEventHandler<PostPublishedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostPublishedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (!postEntity.isPublished()) {
      return;
    }

    const contentWithArchivedGroups = (await this._contentRepository.findContentByIdInArchivedGroup(
      postEntity.getId(),
      { shouldIncludeSeries: true }
    )) as PostEntity;

    const seriesIds = uniq([
      ...postEntity.getSeriesIds(),
      ...(contentWithArchivedGroups ? contentWithArchivedGroups?.getSeriesIds() : []),
    ]);

    const postBefore = postEntity.getSnapshot();
    const payload: PostChangedMessagePayload = {
      state: 'publish',
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
        setting: postEntity.get('setting'),
        type: postEntity.get('type'),
        groupIds: postEntity.get('groupIds'),
        communityIds: postEntity.get('communityIds'),
        tags: (postEntity.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
        media: {
          files: (postEntity.get('media').files || []).map((file) => new FileDto(file.toObject())),
          images: (postEntity.get('media').images || []).map(
            (image) => new ImageDto(image.toObject())
          ),
          videos: (postEntity.get('media').videos || []).map(
            (video) => new VideoDto(video.toObject())
          ),
        },
        seriesIds,
        content: postEntity.get('content'),
        mentionUserIds: postEntity.get('mentionUserIds'),
        lang: postEntity.get('lang'),
        isHidden: postEntity.get('isHidden'),
        status: postEntity.get('status'),
        state: {
          attachSeriesIds: postEntity.getState().attachSeriesIds,
          detachSeriesIds: postEntity.getState().detachSeriesIds,
          attachGroupIds: postEntity.getState().attachGroupIds,
          detachGroupIds: postEntity.getState().detachGroupIds,
          attachTagIds: postEntity.getState().attachTagIds,
          detachTagIds: postEntity.getState().detachTagIds,
          attachFileIds: postEntity.getState().attachFileIds,
          detachFileIds: postEntity.getState().detachFileIds,
          attachImageIds: postEntity.getState().attachImageIds,
          detachImageIds: postEntity.getState().detachImageIds,
          attachVideoIds: postEntity.getState().attachVideoIds,
          detachVideoIds: postEntity.getState().detachVideoIds,
        },
        createdAt: postEntity.get('createdAt'),
        updatedAt: postEntity.get('updatedAt'),
        publishedAt: postEntity.get('publishedAt'),
      },
    };

    this._kafkaAdapter.emit(KAFKA_TOPIC.CONTENT.POST_CHANGED, {
      key: postEntity.getId(),
      value: new PostChangedMessagePayload(payload),
    });

    if (postEntity.isProcessing() && postEntity.getVideoIdProcessing()) {
      this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: { videoIds: [postEntity.getVideoIdProcessing()] },
      });
    }
  }
}
