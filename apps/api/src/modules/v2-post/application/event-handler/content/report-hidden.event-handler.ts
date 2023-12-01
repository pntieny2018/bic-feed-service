import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { EntityHelper } from '../../../../../common/helpers';
import { ReportHiddenEvent } from '../../../domain/event';
import { CommentNotFoundException, ContentNotFoundException } from '../../../domain/exception';
import { ReportEntity } from '../../../domain/model/report';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
  IPostGroupRepository,
  POST_GROUP_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ReportHiddenEvent)
export class ReportHiddenEventHandler implements IEventHandler<ReportHiddenEvent> {
  public constructor(
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepo: ICommentRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(POST_GROUP_REPOSITORY_TOKEN)
    private readonly _postGroupRepo: IPostGroupRepository
  ) {}

  public async handle(event: ReportHiddenEvent): Promise<void> {
    const { reportEntities } = event.payload;

    const commentReportEntities = reportEntities.filter(
      (reportEntity) => reportEntity.get('targetType') == CONTENT_TARGET.COMMENT
    );
    const contentReportEntities = reportEntities.filter(
      (reportEntity) => reportEntity.get('targetType') !== CONTENT_TARGET.COMMENT
    );

    await this._hideComment(commentReportEntities);
    await this._hideContent(contentReportEntities);
  }

  private async _hideComment(reportEntities: ReportEntity[]): Promise<void> {
    if (!reportEntities?.length) {
      return;
    }

    const reportEntityMapByCommentId = EntityHelper.entityArrayToArrayRecord<ReportEntity>(
      reportEntities,
      'targetId'
    );

    for (const commentId of Object.keys(reportEntityMapByCommentId)) {
      const commentEntity = await this._commentRepo.findOne({ id: commentId });
      if (!commentEntity) {
        throw new CommentNotFoundException();
      }

      commentEntity.hide();
      await this._commentRepo.update(commentEntity);
    }
  }

  private async _hideContent(reportEntities: ReportEntity[]): Promise<void> {
    if (!reportEntities?.length) {
      return;
    }

    const contentIds = reportEntities.map((reportEntity) => reportEntity.get('targetId'));
    await this._postGroupRepo.updateContentState(contentIds, true);

    const reportEntityMapByContentId = EntityHelper.entityArrayToArrayRecord<ReportEntity>(
      reportEntities,
      'targetId'
    );

    for (const contentId of Object.keys(reportEntityMapByContentId)) {
      const contentEntity = await this._contentRepo.findContentById(contentId);
      if (!contentEntity) {
        throw new ContentNotFoundException();
      }

      contentEntity.hide();
      await this._contentRepo.update(contentEntity);
    }
  }
}
