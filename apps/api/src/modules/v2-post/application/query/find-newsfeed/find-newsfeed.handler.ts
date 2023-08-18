import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindNewsfeedQuery } from './find-newsfeed.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { PostStatus } from '../../../data-type';
import { CursorPaginationResult } from '../../../../../common/types/cursor-pagination-result.type';
import { FindNewsfeedDto } from './find-newsfeed.dto';
import { OrderEnum } from '../../../../../common/dto';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';

@QueryHandler(FindNewsfeedQuery)
export class FindNewsfeedHandler implements IQueryHandler<FindNewsfeedQuery, FindNewsfeedDto> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindNewsfeedQuery): Promise<any> {
    const { rows: ids, meta: meta } = await this._getContentIdsInNewsfeed(query);
    const contentEntities = await this._contentDomainService.getContentByIds({
      ids,
      authUser: query.payload.authUser,
    });

    const result = await this._contentBinding.contentsBinding(
      contentEntities,
      query.payload.authUser
    );

    return {
      list: result,
      meta,
    };
  }

  private async _getContentIdsInNewsfeed(
    query: FindNewsfeedQuery
  ): Promise<CursorPaginationResult<string>> {
    const { isMine, type, isSaved, limit, isImportant, after, before, authUser } = query.payload;
    const { rows, meta } = await this._contentRepository.getPagination({
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
      limit,
      order: OrderEnum.DESC,
      orderOptions: {
        isImportantFirst: isImportant,
        isPublishedByDesc: true,
      },
      before,
      after,
    });

    return {
      rows: rows.map((row) => row.getId()),
      meta,
    };
  }
}
