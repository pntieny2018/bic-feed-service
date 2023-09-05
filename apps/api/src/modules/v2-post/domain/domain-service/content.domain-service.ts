import { Inject, Logger } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { PostStatus, PostType } from '../../data-type';
import { ContentNotFoundException } from '../exception';
import { StringHelper } from '../../../../common/helpers';
import {
  GetContentByIdsProps,
  GetDraftsProps,
  GetScheduledContentProps,
  IContentDomainService,
} from './interface';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import { ArticleEntity, PostEntity, SeriesEntity, ContentEntity } from '../model/content';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { TargetType } from '../../../report-content/contstants';

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

  public async getReportedContentIdsByUser(
    reportUser: string,
    postTypes?: PostType[]
  ): Promise<string[]> {
    if (!postTypes) {
      return this._contentRepository.getReportedContentIdsByUser(reportUser, [
        TargetType.ARTICLE,
        TargetType.POST,
      ]);
    }

    const target = [];
    if (postTypes.includes(PostType.POST)) {
      target.push(TargetType.POST);
    }
    if (postTypes.includes(PostType.ARTICLE)) {
      target.push(TargetType.ARTICLE);
    }

    return this._contentRepository.getReportedContentIdsByUser(reportUser, target);
  }
}
