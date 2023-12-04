import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { ReportHiddenEvent } from '../../../domain/event';

@EventsHandlerAndLog(ReportHiddenEvent)
export class SearchReportHiddenEventHandler implements IEventHandler<ReportHiddenEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: ReportHiddenEvent): Promise<void> {
    const { report } = event.payload;

    const targetType = report.get('targetType');
    const targetId = report.get('targetId');

    if (targetType === CONTENT_TARGET.COMMENT) {
      return;
    }

    await this._postSearchService.deletePostsToSearch([{ id: targetId }]);
  }
}
