import { CONTENT_TARGET } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ReportNotFoundException } from '../../../../domain/exception';
import { ArticleEntity, PostEntity } from '../../../../domain/model/content';
import {
  COMMENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICommentRepository,
  IContentRepository,
  IReportRepository,
  REPORT_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { IReportValidator, REPORT_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import {
  COMMENT_BINDING_TOKEN,
  CONTENT_BINDING_TOKEN,
  ICommentBinding,
  IContentBinding,
} from '../../../binding';
import { ArticleDto, CommentBaseDto, PostDto, ReportTargetDto } from '../../../dto';

import { GetReportQuery } from './get-report-details.query';

@QueryHandler(GetReportQuery)
export class GetReportHandler implements IQueryHandler<GetReportQuery, ReportTargetDto> {
  public constructor(
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(REPORT_VALIDATOR_TOKEN)
    private readonly _reportValidator: IReportValidator,
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepo: ICommentRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

  public async execute(query: GetReportQuery): Promise<ReportTargetDto> {
    const { groupId, reportId, authUser } = query.payload;

    await this._reportValidator.checkPermissionManageReport(authUser.id, groupId);

    const reportEntity = await this._reportRepo.findOne({
      where: { id: reportId },
      include: { details: true },
    });
    if (!reportEntity) {
      throw new ReportNotFoundException();
    }

    const targetId = reportEntity.get('targetId');
    const targetType = reportEntity.get('targetType');
    const reportDetails = reportEntity.get('details');

    const target = await this._getReportTarget(targetId, targetType, authUser);
    const reasonCounts = await this._reportDomain.countReportReasons(reportDetails, true);

    return { target, reasonCounts };
  }

  private async _getReportTarget(
    targetId: string,
    targetType: CONTENT_TARGET,
    authUser: UserDto
  ): Promise<PostDto | ArticleDto | CommentBaseDto> {
    if (targetType === CONTENT_TARGET.COMMENT) {
      const commentEntity = await this._commentRepo.findOne({ id: targetId });
      return commentEntity
        ? this._commentBinding.commentBinding(commentEntity, { actor: authUser })
        : null;
    }

    const contentEntity = await this._contentRepo.findContentById(targetId, {
      mustIncludeGroup: true,
      shouldIncludeLinkPreview: true,
      shouldIncludeSeries: true,
    });
    if (!contentEntity) {
      return null;
    }

    if (targetType === CONTENT_TARGET.POST) {
      return this._contentBinding.postBinding(contentEntity as PostEntity, { authUser });
    }

    return this._contentBinding.articleBinding(contentEntity as ArticleEntity, { authUser });
  }
}
