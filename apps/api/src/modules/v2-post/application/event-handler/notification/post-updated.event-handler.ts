import { ArrayHelper } from '@libs/common/helpers';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { PostHasBeenUpdated } from '../../../../../common/constants';
import { PostUpdatedEvent } from '../../../domain/event';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding';
import { FileDto, ImageDto, PostDto, QuizDto, VideoDto } from '../../dto';

@EventsHandlerAndLog(PostUpdatedEvent)
export class NotiPostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (postEntity.isHidden() || !postEntity.isPublished()) {
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
    const seriesEntities = (await this._contentRepository.findAll({
      where: {
        groupArchived: false,
        isHidden: false,
        ids: seriesIds,
      },
    })) as SeriesEntity[];

    const postDto = await this._contentBinding.postBinding(postEntity, {
      actor,
      authUser: actor,
    });

    const oldPost = postEntity.getSnapshot();
    const oldGroups = await this._groupAdapter.getGroupsByIds(oldPost.groupIds);
    const oldCommunities = await this._groupAdapter.getGroupsByIds(
      ArrayHelper.arrayUnique(oldGroups.map((group) => group.rootGroupId))
    );
    const oldSeriesEntities = await this._contentRepository.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        groupArchived: false,
        isHidden: false,
        ids: oldPost.seriesIds,
      },
    });
    const oldPostDto = new PostDto({
      ...oldPost,
      audience: {
        groups: oldGroups,
      },
      communities: oldCommunities,
      tags: (oldPost.tags || []).map((tag) => ({
        id: tag.get('id'),
        name: tag.get('name'),
        groupId: tag.get('groupId'),
      })),
      series: (oldSeriesEntities || []).map((series) => ({
        id: series.getId(),
        title: series.getTitle(),
        createdBy: series.getCreatedBy(),
      })),
      quiz: oldPost.quiz?.isVisible(actor.id)
        ? new QuizDto({
            id: oldPost.quiz.get('id'),
            title: oldPost.quiz.get('title'),
            description: oldPost.quiz.get('description'),
            status: oldPost.quiz.get('status'),
            genStatus: oldPost.quiz.get('genStatus'),
            error: oldPost.quiz.get('error'),
          })
        : undefined,
      linkPreview: oldPost.linkPreview
        ? {
            url: oldPost.linkPreview.get('url'),
            title: oldPost.linkPreview.get('title'),
            description: oldPost.linkPreview.get('description'),
            image: oldPost.linkPreview.get('image'),
            domain: oldPost.linkPreview.get('domain'),
          }
        : null,
      media: {
        files: (oldPost.media?.files || []).map((file) => new FileDto(file.toObject())),
        images: (oldPost.media?.images || []).map((image) => new ImageDto(image.toObject())),
        videos: (oldPost.media?.videos || []).map((video) => new VideoDto(video.toObject())),
      },
      actor,
    });

    const seriesActorIds = (seriesEntities || []).map((series) => series.get('createdBy'));

    await this._notiAdapter.sendPostNotification({
      event: PostHasBeenUpdated,
      actor,
      post: postDto,
      oldPost: oldPostDto,
      ignoreUserIds: seriesActorIds,
    });
  }
}
