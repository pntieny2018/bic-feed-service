import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { SearchService } from '../../../../search/search.service';
import { PostPublishedEvent } from '../../../domain/event';
import { PostEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { IMediaBinding, MEDIA_BINDING_TOKEN } from '../../binding/binding-media';
import { TagDto } from '../../dto';

@EventsHandlerAndLog(PostPublishedEvent)
export class SearchPostPublishedEventHandler implements IEventHandler<PostPublishedEvent> {
  public constructor(
    @Inject(MEDIA_BINDING_TOKEN)
    private readonly _mediaBinding: IMediaBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: PostPublishedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (!postEntity.isPublished()) {
      return;
    }

    const contentWithArchivedGroups = (await this._contentRepo.findContentByIdInArchivedGroup(
      postEntity.getId(),
      { shouldIncludeSeries: true }
    )) as PostEntity;

    const seriesIds = uniq([
      ...postEntity.getSeriesIds(),
      ...(contentWithArchivedGroups ? contentWithArchivedGroups?.getSeriesIds() : []),
    ]);

    await this._postSearchService.addPostsToSearch([
      {
        id: postEntity.getId(),
        type: postEntity.getType(),
        content: postEntity.get('content'),
        media: this._mediaBinding.binding(postEntity.get('media')),
        isHidden: postEntity.isHidden(),
        mentionUserIds: postEntity.get('mentionUserIds'),
        groupIds: postEntity.get('groupIds'),
        communityIds: postEntity.get('communityIds'),
        seriesIds,
        tags: (postEntity.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
        createdBy: actor.id,
        createdAt: postEntity.get('createdAt'),
        updatedAt: postEntity.get('updatedAt'),
        publishedAt: postEntity.get('publishedAt'),
      },
    ]);
  }
}
