import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { ArticleDto, PostDto, SeriesDto } from '../../dto';
import { FindNewsfeedQuery } from './find-newsfeed.query';
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
import { FindNewsfeedDto } from './find-newsfeed.dto';
import { FindTimelineGroupQuery } from '../find-timeline-group/find-timeline-group.query';
import { createCursor, getLimitFromAfter } from '../../../../../common/dto';

@QueryHandler(FindNewsfeedQuery)
export class FindNewsfeedHandler implements IQueryHandler<FindNewsfeedQuery, FindNewsfeedDto> {
  @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService;
  @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService;
  @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepository: IContentRepository;
  @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator;
  @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding;
  @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery;
  @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService;

  public constructor(private _queryBus: QueryBus) {}

  public async execute(query: FindNewsfeedQuery): Promise<any> {
    const { rows: ids, meta: meta } = await this._getContentIdsInNewsfeed(query);
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

  private async _getContentIdsInNewsfeed(
    query: FindNewsfeedQuery
  ): Promise<CursorPaginationResult<string>> {
    const { isMine, type, isSaved, limit, isImportant, after, authUser } = query.payload;
    const offset = getLimitFromAfter(after);
    const rows = await this._contentRepository.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        isHidden: false,
        status: PostStatus.PUBLISHED,
        inNewsfeedUserId: authUser.id,
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
      offset,
      limit: limit + 1,
      order: {
        isImportantFirst: isImportant,
      },
    });

    const hasMore = rows.length > limit;

    if (hasMore) rows.pop();
    return {
      rows: rows.map((row) => row.getId()),
      meta: {
        hasNextPage: hasMore,
        endCursor: rows.length > 0 ? createCursor({ offset: limit + offset }) : undefined,
      },
    };
  }
}
