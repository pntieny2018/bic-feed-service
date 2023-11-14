import { CONTENT_TARGET } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ArticleEntity, PostEntity } from '../../../../domain/model/content';
import {
  IReportContentValidator,
  REPORT_CONTENT_VALIDATOR_TOKEN,
} from '../../../../domain/validator/interface';
import {
  COMMENT_BINDING_TOKEN,
  CONTENT_BINDING_TOKEN,
  ICommentBinding,
  IContentBinding,
} from '../../../binding';
import { ArticleDto, CommentBaseDto, GetReportContentDetailsDto, PostDto } from '../../../dto';

import { GetReportDetailsQuery } from './get-report-details.query';

@QueryHandler(GetReportDetailsQuery)
export class GetReportDetailsHandler
  implements IQueryHandler<GetReportDetailsQuery, GetReportContentDetailsDto>
{
  public constructor(
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomainService: IReportDomainService,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(REPORT_CONTENT_VALIDATOR_TOKEN)
    private readonly _reportContentValidator: IReportContentValidator
  ) {}

  public async execute(query: GetReportDetailsQuery): Promise<GetReportContentDetailsDto> {
    const { rootGroupId, reportId, authUser } = query.payload;

    await this._reportContentValidator.canManageReportContent({
      rootGroupId,
      userId: authUser.id,
    });

    const reportEntity = await this._reportDomainService.getReport(reportId);

    let contentDto: PostDto | ArticleDto = null;
    let commentDto: CommentBaseDto | null = null;

    switch (reportEntity.get('targetType')) {
      case CONTENT_TARGET.COMMENT:
        const comment = await this._commentDomainService.getVisibleComment(
          reportEntity.get('targetId')
        );
        commentDto = await this._commentBinding.commentBinding(comment, {
          actor: authUser,
        });
        break;
      case CONTENT_TARGET.POST:
        const post = await this._contentDomainService.getVisibleContent(
          reportEntity.get('targetId')
        );
        contentDto = await this._contentBinding.postBinding(post as PostEntity, {
          authUser,
        });

        break;
      case CONTENT_TARGET.ARTICLE:
        const article = await this._contentDomainService.getVisibleContent(
          reportEntity.get('targetId')
        );
        contentDto = await this._contentBinding.articleBinding(article as ArticleEntity, {
          authUser,
        });
        break;
      default:
        break;
    }

    return new GetReportContentDetailsDto({
      ...(contentDto && { content: contentDto }),
      ...(commentDto && { comment: commentDto }),
    });
  }
}
