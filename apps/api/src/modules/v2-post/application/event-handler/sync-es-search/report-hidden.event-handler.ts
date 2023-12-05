import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { SearchService } from '../../../../search/search.service';
import { ReportHiddenEvent } from '../../../domain/event';

@EventsHandlerAndLog(ReportHiddenEvent)
export class SearchReportHiddenEventHandler implements IEventHandler<ReportHiddenEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: ReportHiddenEvent): Promise<void> {
    const { reportEntities } = event.payload;

    const contentReportEntities = reportEntities.filter(
      (reportEntity) => reportEntity.get('targetType') !== CONTENT_TARGET.COMMENT
    );

    if (!contentReportEntities.length) {
      return;
    }

    const contentIds = uniq(
      contentReportEntities.map((reportEntity) => reportEntity.get('targetId'))
    );
    await this._postSearchService.deletePostsToSearch(contentIds.map((id) => ({ id })));
  }
}
