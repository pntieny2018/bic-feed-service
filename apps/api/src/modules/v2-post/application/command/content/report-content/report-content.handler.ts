import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ContentNotFoundException, ValidationException } from '../../../../domain/exception';
import { ArticleEntity, PostEntity } from '../../../../domain/model/content';

import { ReportContentCommand } from './report-content.command';

@CommandHandler(ReportContentCommand)
export class ReportContentHandler implements ICommandHandler<ReportContentCommand, void> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService,
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService
  ) {}

  public async execute(command: ReportContentCommand): Promise<void> {
    const { authUser, contentId, reasonType, reason } = command.payload;

    const contentEntity = await this._contentDomain.getVisibleContent(contentId);

    if (!(contentEntity instanceof PostEntity || contentEntity instanceof ArticleEntity)) {
      throw new ContentNotFoundException();
    }

    if (authUser.id === contentEntity.getCreatedBy()) {
      throw new ValidationException('You cant not report yourself');
    }

    await this._reportDomain.reportContent({
      authUser,
      reasonType,
      reason,
      content: contentEntity,
    });
  }
}
