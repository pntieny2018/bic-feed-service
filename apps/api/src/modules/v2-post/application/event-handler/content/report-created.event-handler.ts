import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { EntityHelper } from '../../../../../common/helpers';
import { ReportCreatedEvent } from '../../../domain/event';
import { ReportEntity } from '../../../domain/model/report';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ReportCreatedEvent)
export class ReportCreatedEventHandler implements IEventHandler<ReportCreatedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

  public async handle(event: ReportCreatedEvent): Promise<void> {
    const { reportEntities } = event.payload;

    const contentReportEntities = reportEntities.filter(
      (reportEntity) => reportEntity.get('targetType') !== CONTENT_TARGET.COMMENT
    );

    if (!contentReportEntities.length) {
      return;
    }

    const reportEntityMapByContentId = EntityHelper.entityArrayToArrayRecord<ReportEntity>(
      contentReportEntities,
      'targetId'
    );

    for (const contentId of Object.keys(reportEntityMapByContentId)) {
      await this._updateContentReported(contentId);
      await this._unSaveContentForReporters(contentId, reportEntityMapByContentId[contentId]);
    }
  }

  private async _updateContentReported(contentId: string): Promise<void> {
    const contentEntity = await this._contentRepo.getContentById(contentId);
    contentEntity.setReported(true);
    await this._contentRepo.update(contentEntity);
  }

  private async _unSaveContentForReporters(
    contentId: string,
    reportEntities: ReportEntity[]
  ): Promise<void> {
    const attachDetails = reportEntities
      .map((reportEntity) => reportEntity.getState().attachDetails || [])
      .flat();
    const reporterIds = uniq(attachDetails.map((detail) => detail.reporterId));

    for (const reporterId of reporterIds) {
      await this._contentRepo.unSaveContent(reporterId, contentId);
    }
  }
}
