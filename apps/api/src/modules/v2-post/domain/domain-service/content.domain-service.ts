import { Inject, Logger } from '@nestjs/common';
import { isEmpty } from 'class-validator';

import { StringHelper } from '../../../../common/helpers';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { PostStatus } from '../../data-type';
import { ContentNotFoundException } from '../exception';
import { ArticleEntity, PostEntity, SeriesEntity, ContentEntity } from '../model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';

import {
  GetContentByIdsProps,
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

  public async getVisibleContent(id: string): Promise<ContentEntity> {
    const entity = await this._contentRepository.findOne({
      include: {
        mustIncludeGroup: true,
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

  public async getImportantContent(id: string): Promise<ContentEntity> {
    const contentEntity = await this._contentRepository.findOne({
      where: {
        id,
      },
    });
    if (!contentEntity || contentEntity.isHidden()) {
      return;
    }
    if (contentEntity.isDraft()) {
      return;
    }
    if (!contentEntity.isImportant()) {
      return;
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
    const { authUser, isProcessing, type } = input;
    return this._contentRepository.getPagination({
      ...input,
      where: {
        createdBy: authUser.id,
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
    const { ids, authUser } = input;
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
          userId: authUser?.id,
        },
        shouldIncludeMarkReadImportant: {
          userId: authUser?.id,
        },
        shouldIncludeReaction: {
          userId: authUser?.id,
        },
      },
    });

    return contentEntities.sort((a, b) => ids.indexOf(a.getId()) - ids.indexOf(b.getId()));
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
