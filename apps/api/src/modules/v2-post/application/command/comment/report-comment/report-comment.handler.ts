import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ValidationException } from '../../../../domain/exception';

import { ReportCommentCommand } from './report-comment.command';

@CommandHandler(ReportCommentCommand)
export class ReportContentHandler implements ICommandHandler<ReportCommentCommand, void> {
  public constructor(
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomain: ICommentDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService,
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService
  ) {}

  public async execute(command: ReportCommentCommand): Promise<void> {
    const { authUser, commentId, reasonType, reason } = command.payload;

    const commentEntity = await this._commentDomain.getVisibleComment(commentId);

    if (authUser.id === commentEntity.get('createdBy')) {
      throw new ValidationException('You cant not report yourself');
    }

    await this._reportDomain.reportComment({
      authUser,
      reasonType,
      reason,
      comment: commentEntity,
    });
  }
}
