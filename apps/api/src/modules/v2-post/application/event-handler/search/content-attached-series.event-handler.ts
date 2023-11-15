import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { ContentAttachedSeriesEvent } from '../../../domain/event';
import { ArticleEntity, PostEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ContentAttachedSeriesEvent)
export class SearchContentAttachedSeriesEventHandler
  implements IEventHandler<ContentAttachedSeriesEvent>
{
  public constructor(
    private readonly _postSearchService: SearchService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async handle(event: ContentAttachedSeriesEvent): Promise<void> {
    const { contentId } = event.payload;

    const content = (await this._contentRepository.findContentById(contentId, {
      shouldIncludeSeries: true,
    })) as PostEntity | ArticleEntity;

    await this._postSearchService.updateAttributePostToSearch(
      { id: content.getId(), lang: content.getLang() },
      {
        seriesIds: content.getSeriesIds(),
      }
    );
  }
}
