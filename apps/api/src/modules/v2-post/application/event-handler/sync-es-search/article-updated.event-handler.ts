import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { SearchService } from '../../../../search/search.service';
import { ArticleUpdatedEvent } from '../../../domain/event';
import { ArticleEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { IMediaBinding, MEDIA_BINDING_TOKEN } from '../../binding/binding-media';
import { TagDto } from '../../dto';

@EventsHandlerAndLog(ArticleUpdatedEvent)
export class SearchArticleUpdatedEventHandler implements IEventHandler<ArticleUpdatedEvent> {
  public constructor(
    @Inject(MEDIA_BINDING_TOKEN)
    private readonly _mediaBinding: IMediaBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: ArticleUpdatedEvent): Promise<void> {
    const { entity: articleEntity } = event.payload;

    if (articleEntity.isHidden() || !articleEntity.isPublished()) {
      return;
    }

    const contentWithArchivedGroups = (await this._contentRepo.findContentByIdInArchivedGroup(
      articleEntity.getId(),
      { shouldIncludeSeries: true }
    )) as ArticleEntity;

    const seriesIds = uniq([
      ...articleEntity.getSeriesIds(),
      ...(contentWithArchivedGroups ? contentWithArchivedGroups?.getSeriesIds() : []),
    ]);

    await this._postSearchService.updatePostsToSearch([
      {
        id: articleEntity.getId(),
        type: articleEntity.getType(),
        content: articleEntity.get('content'),
        isHidden: articleEntity.isHidden(),
        groupIds: articleEntity.getGroupIds(),
        communityIds: articleEntity.get('communityIds'),
        seriesIds,
        createdBy: articleEntity.getCreatedBy(),
        lang: articleEntity.get('lang'),
        updatedAt: articleEntity.get('updatedAt'),
        createdAt: articleEntity.get('createdAt'),
        publishedAt: articleEntity.get('publishedAt'),
        title: articleEntity.getTitle(),
        summary: articleEntity.get('summary'),
        coverMedia: this._mediaBinding.imageBinding(articleEntity.get('cover')),
        categories: (articleEntity.get('categories') || []).map((item) => ({
          id: item.get('id'),
          name: item.get('name'),
        })),
        tags: (articleEntity.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
      },
    ]);
  }
}
