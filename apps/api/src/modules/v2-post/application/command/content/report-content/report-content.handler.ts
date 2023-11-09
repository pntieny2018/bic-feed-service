import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ContentNotFoundException, ReportOwnContentException } from '../../../../domain/exception';
import { ArticleEntity, PostEntity } from '../../../../domain/model/content';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../../domain/validator/interface';

import { ReportContentCommand } from './report-content.command';

@CommandHandler(ReportContentCommand)
export class ReportContentHandler implements ICommandHandler<ReportContentCommand, void> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService,
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator
  ) {}

  public async execute(command: ReportContentCommand): Promise<void> {
    const { authUser, contentId, reasonType, reason } = command.payload;

    const contentEntity = await this._contentDomain.getVisibleContent(contentId);

    const isReportableContent =
      contentEntity instanceof PostEntity || contentEntity instanceof ArticleEntity;
    if (!isReportableContent) {
      throw new ContentNotFoundException();
    }

    await this._contentValidator.checkCanReadContent(contentEntity, authUser);

    if (contentEntity.isOwner(authUser.id)) {
      throw new ReportOwnContentException();
    }

    await this._reportDomain.reportContent({
      authUser,
      reasonType,
      reason,
      content: contentEntity,
    });
  }
}
