import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { ArticleDto, PostDto, SeriesDto } from '../../dto';
import { FindNewsfeedQuery } from './find-newsfeed.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { PostStatus } from '../../../data-type';
import { FindPostsByIdsQuery } from '../find-posts-by-ids/find-posts-by-ids.query';
import { CursorPaginationResult } from '../../../../../common/types/cursor-pagination-result.type';
import { FindNewsfeedDto } from './find-newsfeed.dto';
import { createCursor, getLimitFromAfter } from '../../../../../common/dto';

@QueryHandler(FindNewsfeedQuery)
export class FindNewsfeedHandler implements IQueryHandler<FindNewsfeedQuery, FindNewsfeedDto> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    private _queryBus: QueryBus
  ) {}

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
        inNewsfeedUserId: authUser?.id,
        groupArchived: false,
        excludeReportedByUserId: authUser?.id,
        isImportant,
        createdBy: isMine ? authUser?.id : undefined,
        savedByUserId: isSaved ? authUser?.id : undefined,
        type,
      },
      include: {
        shouldIncludeImportant: {
          userId: authUser?.id,
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
