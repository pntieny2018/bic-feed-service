import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { ArticleUpdatedEvent } from '../../../domain/event';
import { ImageDto, TagDto } from '../../dto';

@EventsHandlerAndLog(ArticleUpdatedEvent)
export class SearchArticleUpdatedEventHandler implements IEventHandler<ArticleUpdatedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: ArticleUpdatedEvent): Promise<void> {
    const { articleEntity } = event;

    if (articleEntity.isHidden() || !articleEntity.isPublished()) {
      return;
    }

    await this._postSearchService.updatePostsToSearch([
      {
        id: articleEntity.getId(),
        type: articleEntity.getType(),
        content: articleEntity.get('content'),
        isHidden: articleEntity.isHidden(),
        groupIds: articleEntity.getGroupIds(),
        communityIds: articleEntity.get('communityIds'),
        seriesIds: articleEntity.getSeriesIds(),
        createdBy: articleEntity.getCreatedBy(),
        lang: articleEntity.get('lang'),
        updatedAt: articleEntity.get('updatedAt'),
        createdAt: articleEntity.get('createdAt'),
        publishedAt: articleEntity.get('publishedAt'),
        title: articleEntity.getTitle(),
        summary: articleEntity.get('summary'),
        coverMedia: new ImageDto(articleEntity.get('cover').toObject()),
        categories: (articleEntity.get('categories') || []).map((item) => ({
          id: item.get('id'),
          name: item.get('name'),
        })),
        tags: (articleEntity.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
      },
    ]);
  }
}
