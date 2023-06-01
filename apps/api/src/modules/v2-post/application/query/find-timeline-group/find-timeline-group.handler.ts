import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { ArticleDto, PostDto, SeriesDto } from '../../dto';
import { FindTimelineGroupQuery } from './find-timeline-group.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import { PostStatus } from '../../../data-type';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { FindPostsByIdsHandler } from '../find-posts-by-ids/find-posts-by-ids.handler';
import { FindPostsByIdsQuery } from '../find-posts-by-ids/find-posts-by-ids.query';
import { CursorPaginationResult } from '../../../../../common/types/cursor-pagination-result.type';
import { FindTimelineGroupDto } from './find-timeline-group.dto';

@QueryHandler(FindTimelineGroupQuery)
export class FindTimelineGroupHandler
  implements IQueryHandler<FindTimelineGroupQuery, FindTimelineGroupDto>
{
  @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService;
  @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService;
  @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepository: IContentRepository;
  @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator;
  @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding;
  @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery;
  @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService;

  public constructor(private _queryBus: QueryBus) {}

  public async execute(query: FindTimelineGroupQuery): Promise<any> {
    const { rows: ids, meta } = await this._getContentIds(query);
    const result = await this._queryBus.execute<
      FindPostsByIdsQuery,
      (PostDto | ArticleDto | SeriesDto)[]
    >(
      new FindPostsByIdsQuery({
        ids,
        authUser: query.payload.authUser,
      })
    );

    return {
      list: result,
      meta,
    };
  }

  private async _getContentIds(
    query: FindTimelineGroupQuery
  ): Promise<CursorPaginationResult<string>> {
    const { groupId, isImportant, isMine, type, isSaved, limit, before, after, authUser } =
      query.payload;
    const { rows, meta } = await this._contentRepository.getPagination({
      attributes: {
        exclude: ['content'],
      },
      before,
      after,
      where: {
        isHidden: false,
        status: PostStatus.PUBLISHED,
        groupId,
        groupArchived: false,
        excludeReportedByUserId: authUser.id,
        isImportant,
        createdBy: isMine ? authUser.id : undefined,
        savedByUserId: isSaved ? authUser.id : undefined,
        type,
      },
      include: {
        shouldIncludeImportant: {
          userId: authUser.id,
        },
      },
      limit,
      order: {
        isImportantFirst: true,
      },
    });
    return {
      rows: rows.map((row) => row.getId()),
      meta,
    };
  }
}
