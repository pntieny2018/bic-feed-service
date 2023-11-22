import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ReportOwnContentException } from '../../../../domain/exception';

import { ReportCommentCommand } from './report-comment.command';

@CommandHandler(ReportCommentCommand)
export class ReportCommentHandler implements ICommandHandler<ReportCommentCommand, void> {
  public constructor(
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomain: ICommentDomainService,
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService
  ) {}

  public async execute(command: ReportCommentCommand): Promise<void> {
    const { authUser, commentId, reasonType, reason } = command.payload;

    const commentEntity = await this._commentDomain.getVisibleComment(commentId);

    if (commentEntity.isOwner(authUser.id)) {
      throw new ReportOwnContentException();
    }

    await this._reportDomain.reportComment({
      authUser,
      reasonType,
      reason,
      comment: commentEntity,
    });
  }
}
