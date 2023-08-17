import { Inject, Logger } from '@nestjs/common';
import { isEmpty } from 'class-validator';

import { OrderEnum } from '../../../../common/dto';
import { StringHelper } from '../../../../common/helpers';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { PostStatus } from '../../data-type';
import { ContentNotFoundException } from '../exception';
import { ArticleEntity, PostEntity, SeriesEntity, ContentEntity } from '../model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';

import {
  GetContentByIdsProps,
  GetContentIdsInNewsFeedProps,
  GetDraftsProps,
  GetScheduledContentProps,
  IContentDomainService,
} from './interface';

export class ContentDomainService implements IContentDomainService {
  private readonly _logger = new Logger(ContentDomainService.name);
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async getVisibleContent(
    id: string,
    excludeReportedByUserId?: string
  ): Promise<ContentEntity> {
    const entity = await this._contentRepository.findOne({
      include: {
        mustIncludeGroup: true,
        ...(excludeReportedByUserId && {
          excludeReportedByUserId,
        }),
      },
      where: {
        id,
      },
    });

    if (!entity || !entity.isVisible()) {
      throw new ContentNotFoundException();
    }
    return entity;
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
        status: PostStatus.DRAFT,
        ...(isProcessing && {
          status: PostStatus.PROCESSING,
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
      order = OrderEnum.DESC,
    } = props;
    const { rows, meta } = await this._contentRepository.getPagination({
      attributes: {
        exclude: ['content'],
      },
      where: {
        isHidden: false,
        status: PostStatus.PUBLISHED,
        inNewsfeedUserId: authUserId,
        groupArchived: false,
        excludeReportedByUserId: authUserId,
        isImportant,
        createdBy: isMine ? authUserId : undefined,
        savedByUserId: isSaved ? authUserId : undefined,
        type,
      },
      include: {
        shouldIncludeImportant: {
          userId: authUserId,
        },
      },
      limit,
      order,
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

  public async getScheduledContent(
    input: GetScheduledContentProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>> {
    const { beforeDate } = input;

    return this._contentRepository.getPagination({
      ...input,
      where: {
        status: PostStatus.WAITING_SCHEDULE,
        scheduledAt: beforeDate,
      },
      attributes: {
        exclude: ['content'],
      },
    });
  }
}
