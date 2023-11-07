import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { ReportCreatedEvent } from '../../../domain/event';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ReportCreatedEvent)
export class ReportCreatedEventHandler implements IEventHandler<ReportCreatedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

  public async handle(event: ReportCreatedEvent): Promise<void> {
    const { report } = event.payload;

    const targetType = report.get('targetType');
    if (targetType === CONTENT_TARGET.POST || targetType === CONTENT_TARGET.ARTICLE) {
      const content = await this._contentRepo.getContentById(report.get('targetId'));
      content.setReported(true);

      await this._contentRepo.update(content);

      const { attachDetails } = report.getState() || {};
      for (const reportDetail of attachDetails) {
        await this._contentRepo.unSaveContent(reportDetail.createdBy, reportDetail.targetId);
      }
    }
  }
}
