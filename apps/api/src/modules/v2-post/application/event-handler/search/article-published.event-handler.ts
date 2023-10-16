import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { SearchService } from '../../../../search/search.service';
import { ArticlePublishedEvent } from '../../../domain/event';
import { ArticleEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ImageDto } from '../../dto';

@EventsHandlerAndLog(ArticlePublishedEvent)
export class SearchArticlePublishedEventHandler implements IEventHandler<ArticlePublishedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: ArticlePublishedEvent): Promise<void> {
    const { articleEntity } = event;

    const contentWithArchivedGroups = (await this._contentRepository.findContentByIdInArchivedGroup(
      articleEntity.getId(),
      { shouldIncludeSeries: true }
    )) as ArticleEntity;

    const seriesIds = uniq([
      ...articleEntity.getSeriesIds(),
      ...(contentWithArchivedGroups ? contentWithArchivedGroups?.getSeriesIds() : []),
    ]);

    await this._postSearchService.addPostsToSearch([
      {
        id: articleEntity.getId(),
        type: articleEntity.getType(),
        content: articleEntity.get('content'),
        isHidden: articleEntity.isHidden(),
        groupIds: articleEntity.getGroupIds(),
        communityIds: articleEntity.get('communityIds'),
        seriesIds,
        createdBy: articleEntity.getCreatedBy(),
        updatedAt: articleEntity.get('updatedAt'),
        createdAt: articleEntity.get('createdAt'),
        publishedAt: articleEntity.get('publishedAt'),
        title: articleEntity.getTitle(),
        summary: articleEntity.get('summary'),
        coverMedia: new ImageDto(articleEntity.get('cover').toObject()),
        categories: (articleEntity.get('categories') || []).map((category) => ({
          id: category.get('id'),
          name: category.get('name'),
        })),
        tags: (articleEntity.get('tags') || []).map((tag) => ({
          id: tag.get('id'),
          name: tag.get('name'),
          groupId: tag.get('groupId'),
        })),
      },
    ]);
  }
}
