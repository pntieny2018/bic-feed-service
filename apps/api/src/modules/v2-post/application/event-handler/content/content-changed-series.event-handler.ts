import { CONTENT_STATUS } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { ContentChangedSeriesEvent } from '../../../domain/event';
import { ArticleEntity, PostEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ContentChangedSeriesEvent)
export class ContentChangedSeriesEventHandler implements IEventHandler<ContentChangedSeriesEvent> {
  public constructor(
    private readonly _postSearchService: SearchService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async handle(event: ContentChangedSeriesEvent): Promise<void> {
    const { contentIds } = event.payload;

    const contents = (await this._contentRepository.findAll({
      where: {
        ids: contentIds,
        status: CONTENT_STATUS.PUBLISHED,
      },
      include: {
        shouldIncludeSeries: true,
      },
    })) as (PostEntity | ArticleEntity)[];

    for (const content of contents) {
      await this._postSearchService.updateAttributePostToSearch(
        { id: content.getId(), lang: content.getLang() },
        {
          seriesIds: content.getSeriesIds(),
        }
      );
    }
  }
}
