import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { FindTimelineGroupQuery } from './find-timeline-group.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { PostStatus } from '../../../data-type';
import { CursorPaginationResult } from '../../../../../common/types/cursor-pagination-result.type';
import { FindTimelineGroupDto } from './find-timeline-group.dto';
import { createCursor, getLimitFromAfter } from '../../../../../common/dto';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';

@QueryHandler(FindTimelineGroupQuery)
export class FindTimelineGroupHandler
  implements IQueryHandler<FindTimelineGroupQuery, FindTimelineGroupDto>
{
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(query: FindTimelineGroupQuery): Promise<any> {
    const { rows: ids, meta: meta } = await this._getContentIdsByUser(query);

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

  private async _getContentIdsByUser(
    query: FindTimelineGroupQuery
  ): Promise<CursorPaginationResult<string>> {
    const { groupId, isMine, type, isSaved, limit, isImportant, after, authUser } = query.payload;
    const group = await this._groupAppService.findOne(groupId);
    const groupIds = this._groupAppService.getGroupIdAndChildIdsUserJoined(group, authUser.groups);
    const offset = getLimitFromAfter(after);
    const rows = await this._contentRepository.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        isHidden: false,
        status: PostStatus.PUBLISHED,
        groupIds,
        groupArchived: false,
        excludeReportedByUserId: authUser?.id,
        isImportant,
        createdBy: isMine ? authUser?.id : undefined,
        savedByUserId: isSaved ? authUser?.id : undefined,
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
        isImportantFirst: true,
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
