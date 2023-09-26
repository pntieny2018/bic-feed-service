import { CONTENT_STATUS, CONTENT_TARGET, CONTENT_TYPE, ORDER } from '@beincom/constants';
import {
  CursorPaginationResult,
  createCursor,
  getLimitFromAfter,
} from '@libs/database/postgres/common';
import { Inject } from '@nestjs/common';
import { isEmpty } from 'class-validator';

import { StringHelper } from '../../../../common/helpers';
import { ContentNotFoundException } from '../exception';
import { ArticleEntity, PostEntity, SeriesEntity, ContentEntity } from '../model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';

import {
  GetContentByIdsProps,
  GetContentIdsInNewsFeedProps,
  GetContentIdsInTimelineProps,
  GetContentIdsScheduleProps,
  GetDraftsProps,
  GetImportantContentIdsProps,
  GetScheduledContentProps,
  IContentDomainService,
} from './interface';

export class ContentDomainService implements IContentDomainService {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async getVisibleContent(
    contentId: string,
    excludeReportedByUserId?: string
  ): Promise<ContentEntity> {
    let contentEntity: ContentEntity;

    if (excludeReportedByUserId) {
      contentEntity = await this._contentRepository.findContentByIdExcludeReportedByUserId(
        contentId,
        excludeReportedByUserId,
        { mustIncludeGroup: true }
      );
    } else {
      contentEntity = await this._contentRepository.findContentById(contentId, {
        mustIncludeGroup: true,
      });
    }

    if (!contentEntity || !contentEntity.isVisible()) {
      throw new ContentNotFoundException();
    }

    return contentEntity;
  }

  public getRawContent(contentEntity: ContentEntity): string {
    if (contentEntity instanceof PostEntity) {
      return StringHelper.removeMarkdownCharacter(contentEntity.get('content'));
    } else if (contentEntity instanceof ArticleEntity) {
      return StringHelper.serializeEditorContentToText(contentEntity.get('content'));
    }
    return null;
  }

  public async getDraftsPagination(
    input: GetDraftsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>> {
    const { authUserId, isProcessing, type } = input;
    return this._contentRepository.getPagination({
      ...input,
      where: {
        createdBy: authUserId,
        status: CONTENT_STATUS.DRAFT,
        ...(isProcessing && {
          status: CONTENT_STATUS.PROCESSING,
        }),
        ...(!isEmpty(type) && {
          type,
        }),
      },
      attributes: {
        exclude: ['content'],
      },
    });
  }

  public async getContentByIds(
    input: GetContentByIdsProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]> {
    const { ids, authUserId } = input;
    const contentEntities = await this._contentRepository.findAll({
      where: {
        ids,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeItems: true,
        shouldIncludeLinkPreview: true,
        shouldIncludeQuiz: true,
        shouldIncludeSaved: {
          userId: authUserId,
        },
        shouldIncludeMarkReadImportant: {
          userId: authUserId,
        },
        shouldIncludeReaction: {
          userId: authUserId,
        },
      },
    });

    return contentEntities.sort((a, b) => ids.indexOf(a.getId()) - ids.indexOf(b.getId()));
  }

  public async getContentIdsInNewsFeed(
    props: GetContentIdsInNewsFeedProps
  ): Promise<CursorPaginationResult<string>> {
    const {
      isMine,
      type,
      isSaved,
      limit,
      isImportant,
      after,
      before,
      authUserId,
      order = ORDER.DESC,
    } = props;

    if (isImportant) {
      return this.getImportantContentIds({ ...props, isOnNewsfeed: true });
    }

    const { rows, meta } = await this._contentRepository.getPagination({
      attributes: {
        exclude: ['content'],
      },
      where: {
        isHidden: false,
        status: CONTENT_STATUS.PUBLISHED,
        inNewsfeedUserId: authUserId,
        groupArchived: false,
        excludeReportedByUserId: authUserId,
        createdBy: isMine ? authUserId : undefined,
        savedByUserId: isSaved ? authUserId : undefined,
        type,
      },
      limit,
      order,
      orderOptions: {
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

  public async getContentIdsInTimeline(
    props: GetContentIdsInTimelineProps
  ): Promise<CursorPaginationResult<string>> {
    const {
      authUserId,
      groupIds,
      isMine,
      type,
      isSaved,
      isImportant,
      limit,
      before,
      after,
      order = ORDER.DESC,
    } = props;

    if (isImportant) {
      return this.getImportantContentIds(props);
    }

    const { rows, meta } = await this._contentRepository.getPagination({
      attributes: {
        exclude: ['content'],
      },
      where: {
        isHidden: false,
        status: CONTENT_STATUS.PUBLISHED,
        groupIds,
        groupArchived: false,
        excludeReportedByUserId: authUserId,
        createdBy: isMine ? authUserId : undefined,
        savedByUserId: isSaved ? authUserId : undefined,
        type,
      },
      include: {
        mustIncludeGroup: true,
      },
      limit,
      order,
      orderOptions: {
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

  public async getScheduledContent(
    input: GetScheduledContentProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>> {
    const { beforeDate } = input;

    return this._contentRepository.getPagination({
      ...input,
      where: {
        status: CONTENT_STATUS.WAITING_SCHEDULE,
        scheduledAt: beforeDate,
      },
      attributes: {
        exclude: ['content'],
      },
    });
  }

  public async getContentToBuildMenuSettings(
    id: string,
    userId: string
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    return this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeQuiz: true,
        shouldIncludeSaved: {
          userId,
        },
      },
    });
  }

  public async getReportedContentIdsByUser(
    reportUser: string,
    postTypes?: CONTENT_TYPE[]
  ): Promise<string[]> {
    if (!postTypes) {
      return this._contentRepository.getReportedContentIdsByUser(reportUser, [
        CONTENT_TARGET.ARTICLE,
        CONTENT_TARGET.POST,
      ]);
    }

    const target: CONTENT_TARGET[] = [];
    if (postTypes.includes(CONTENT_TYPE.POST)) {
      target.push(CONTENT_TARGET.POST);
    }
    if (postTypes.includes(CONTENT_TYPE.ARTICLE)) {
      target.push(CONTENT_TARGET.ARTICLE);
    }

    return this._contentRepository.getReportedContentIdsByUser(reportUser, target);
  }

  public async getScheduleContentIds(
    params: GetContentIdsScheduleProps
  ): Promise<CursorPaginationResult<string>> {
    const { user, limit, before, after, type, order } = params;

    const { rows, meta } = await this._contentRepository.getPagination({
      where: {
        createdBy: user.id,
        type,
        statuses: [CONTENT_STATUS.WAITING_SCHEDULE, CONTENT_STATUS.SCHEDULE_FAILED],
      },
      orderOptions: {
        sortColumn: 'scheduledAt',
        orderBy: order,
      },
      limit,
      before,
      after,
      order,
    });

    return {
      rows: rows.map((row) => row.getId()),
      meta,
    };
  }

  public async getImportantContentIds(
    props: GetImportantContentIdsProps
  ): Promise<CursorPaginationResult<string>> {
    const { authUserId, isOnNewsfeed, groupIds, isMine, type, isSaved, limit, after } = props;
    const offset = getLimitFromAfter(after);

    const rows = await this._contentRepository.findAll(
      {
        attributes: {
          exclude: ['content'],
        },
        where: {
          type,
          groupIds,
          isHidden: false,
          isImportant: true,
          groupArchived: false,
          status: CONTENT_STATUS.PUBLISHED,
          excludeReportedByUserId: authUserId,
          createdBy: isMine ? authUserId : undefined,
          savedByUserId: isSaved ? authUserId : undefined,
          inNewsfeedUserId: isOnNewsfeed ? authUserId : undefined,
        },
        include: {
          ...(groupIds && {
            mustIncludeGroup: true,
          }),
          shouldIncludeImportant: {
            userId: authUserId,
          },
        },
        orderOptions: {
          isImportantFirst: true,
          isPublishedByDesc: true,
        },
      },
      {
        offset,
        limit: limit + 1,
      }
    );

    const hasMore = rows.length > limit;

    if (hasMore) {
      rows.pop();
    }

    return {
      rows: rows.map((row) => row.getId()),
      meta: {
        hasNextPage: hasMore,
        endCursor: rows.length > 0 ? createCursor({ offset: limit + offset }) : undefined,
      },
    };
  }
}
