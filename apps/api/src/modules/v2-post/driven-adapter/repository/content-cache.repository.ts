import {
  ArticleCacheDto,
  PostCacheDto,
  ReactionCount,
  SeriesCacheDto,
} from '@api/modules/v2-post/application/dto';
import { QuizEntity } from '@api/modules/v2-post/domain/model/quiz';
import {
  FindAllContentsInCacheProps,
  FindContentInCacheProps,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { ContentMapper, QuizMapper } from '@api/modules/v2-post/driven-adapter/mapper';
import { CONTENT_STATUS } from '@beincom/constants';
import { CACHE_KEYS } from '@libs/common/constants';
import { LibReportDetailRepository } from '@libs/database/postgres/repository';
import { RedisContentService } from '@libs/infra/redis/redis-content.service';
import { Injectable } from '@nestjs/common';
import { isBoolean } from 'lodash';

import { ArticleEntity, PostEntity, SeriesEntity } from '../../domain/model/content';

@Injectable()
export class ContentCacheRepository implements IContentCacheRepository {
  public constructor(
    private readonly _store: RedisContentService,
    private readonly _contentMapper: ContentMapper,
    private readonly _quizMapper: QuizMapper,

    private readonly _libReportDetailRepo: LibReportDetailRepository
  ) {}

  public async existKey(key: string): Promise<boolean> {
    return this._store.existKey(key);
  }

  public async findContent(
    input: FindContentInCacheProps
  ): Promise<PostEntity | ArticleEntity | SeriesEntity> {
    const { id, status, createdBy, isHidden, excludeReportedByUserId } = input.where;

    const cachedContent = await this._store.getJson<
      PostCacheDto | ArticleCacheDto | SeriesCacheDto
    >(`${CACHE_KEYS.CONTENT}:${id}`);

    if (
      !cachedContent ||
      (status && cachedContent.status !== status) ||
      (createdBy && cachedContent.createdBy !== createdBy) ||
      (isBoolean(isHidden) && cachedContent.isHidden !== isHidden)
    ) {
      return null;
    }

    if (excludeReportedByUserId) {
      const isReported = await this._libReportDetailRepo.first({
        where: { targetId: id, reporterId: excludeReportedByUserId },
      });
      if (isReported) {
        return null;
      }
    }

    const cachedContents = await this._filterIncludeOptions([cachedContent], input);

    return this._contentMapper.cacheToDomain(cachedContents[0]);
  }

  public async findContents(
    input: FindAllContentsInCacheProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]> {
    const { ids } = input.where;

    let cachedContents = await this._store.mgetJson<
      PostCacheDto | ArticleCacheDto | SeriesCacheDto
    >(ids.map((id) => `${CACHE_KEYS.CONTENT}:${id}`));

    if (!cachedContents.length) {
      return [];
    }

    cachedContents = await this._filterWhereOptions(cachedContents, input);
    cachedContents = await this._filterIncludeOptions(cachedContents, input);

    return cachedContents.map((cachedContent) => this._contentMapper.cacheToDomain(cachedContent));
  }

  private async _filterWhereOptions(
    cachedContents: (PostCacheDto | ArticleCacheDto | SeriesCacheDto)[],
    input: FindContentInCacheProps | FindAllContentsInCacheProps
  ): Promise<(PostCacheDto | ArticleCacheDto | SeriesCacheDto)[]> {
    const { status, createdBy, isHidden, excludeReportedByUserId } = input.where;

    if (status) {
      cachedContents = cachedContents.filter((content) => content.status === status);
    }
    if (createdBy) {
      cachedContents = cachedContents.filter((content) => content.createdBy === createdBy);
    }
    if (isHidden) {
      cachedContents = cachedContents.filter((content) => content.isHidden === isHidden);
    }

    if (excludeReportedByUserId) {
      let reportedTargetIds = await this.getReportedTargetIdsByUserId(excludeReportedByUserId);

      if (!reportedTargetIds?.length) {
        const contentIds = cachedContents.map((content) => content.id);
        const reportedTargets = await this._libReportDetailRepo.findMany({
          where: { targetId: contentIds, reporterId: excludeReportedByUserId },
        });
        reportedTargetIds = reportedTargets.map((reportedTarget) => reportedTarget.targetId);
      }

      cachedContents = cachedContents.filter((content) => !reportedTargetIds.includes(content.id));
    }

    return cachedContents;
  }

  private async _filterIncludeOptions(
    cachedContents: (PostCacheDto | ArticleCacheDto | SeriesCacheDto)[],
    input: FindContentInCacheProps | FindAllContentsInCacheProps
  ): Promise<(PostCacheDto | ArticleCacheDto | SeriesCacheDto)[]> {
    const {
      mustIncludeGroup,
      shouldIncludeGroup,
      shouldIncludeSeries,
      shouldIncludeItems,
      shouldIncludeCategory,
      shouldIncludeQuiz,
      shouldIncludeLinkPreview,
    } = input.include || {};

    cachedContents.forEach((content) => {
      const groupIds = content.groupIds || [];
      if (mustIncludeGroup && !groupIds.length) {
        content = null;
      } else if (shouldIncludeGroup) {
        content.groupIds = groupIds;
      }

      if (content && !shouldIncludeSeries) {
        delete content['seriesIds'];
      }
      if (content && !shouldIncludeItems) {
        delete content['itemIds'];
      }
      if (content && !shouldIncludeCategory) {
        delete content['categories'];
      }
      if (content && !shouldIncludeQuiz) {
        delete content['quiz'];
      }
      if (content && !shouldIncludeLinkPreview) {
        delete content['linkPreview'];
      }
    });

    return cachedContents.filter((content) => content);
  }

  public async setContents(contents: (PostEntity | ArticleEntity | SeriesEntity)[]): Promise<void> {
    if (!contents.length) {
      return;
    }

    const contentsCacheDto = await this._contentMapper.contentsCacheBinding(contents);
    const pipeline = this._store.getClient().pipeline();
    for (const contentCacheDto of contentsCacheDto) {
      if (!contentCacheDto || contentCacheDto.status !== CONTENT_STATUS.PUBLISHED) {
        continue;
      }

      pipeline.call(
        'JSON.SET',
        `${CACHE_KEYS.CONTENT}:${contentCacheDto.id}`,
        '$',
        JSON.stringify(contentCacheDto)
      );
    }
    await pipeline.exec();
  }

  public async deleteContent(contentId: string): Promise<void> {
    await this._store.del(`${CACHE_KEYS.CONTENT}:${contentId}`);
  }

  public async deleteContents(contentIds: string[]): Promise<void> {
    if (!contentIds?.length) {
      return;
    }
    const pipeline = this._store.getClient().pipeline();
    for (const contentId of contentIds) {
      pipeline.del(`${CACHE_KEYS.CONTENT}:${contentId}`);
    }
    await pipeline.exec();
  }

  public async getReportedTargetIdsByUserId(userId: string): Promise<string[]> {
    return this._store.getSets(`${CACHE_KEYS.USER_REPORTED_CONTENT}:${userId}`);
  }

  public async cacheUserReportedContent(userId: string, contentIds: string[]): Promise<void> {
    await this._store.setSets(`${CACHE_KEYS.USER_REPORTED_CONTENT}:${userId}`, contentIds);
  }

  public async setReactionsCount(contentId: string, reactionsCount: ReactionCount): Promise<void> {
    await this._store.setJson(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      reactionsCount,
      'reactionsCount'
    );
  }

  public async setReactionNameNx(contentId: string, reactionName: string): Promise<any> {
    await this._store.setJson(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      1,
      `reactionsCount.${reactionName}`,
      true
    );
  }

  public async increaseReactionsCount(contentId: string, reactionName: string): Promise<number> {
    return this._store.increaseValue(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      `reactionsCount.${reactionName}`
    );
  }

  public async decreaseReactionsCount(contentId: string, reactionName: string): Promise<number> {
    return this._store.decreaseValue(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      `reactionsCount.${reactionName}`
    );
  }

  public async increaseCommentCount(contentId: string): Promise<void> {
    await this._store.increaseValue(`${CACHE_KEYS.CONTENT}:${contentId}`, 'commentsCount');
  }

  public async decreaseCommentCount(contentId: string, decrease = -1): Promise<void> {
    await this._store.decreaseValue(
      `${CACHE_KEYS.CONTENT}:${contentId}`,
      'commentsCount',
      decrease
    );
  }

  public async increaseSeenContentCount(contentId: string): Promise<void> {
    const isContentCached = await this._store.existKey(`${CACHE_KEYS.CONTENT}:${contentId}`);
    if (!isContentCached) {
      return;
    }
    await this._store.increaseValue(`${CACHE_KEYS.CONTENT}:${contentId}`, 'totalUsersSeen');
  }

  public async updateQuiz(quiz: QuizEntity): Promise<void> {
    const contentId = quiz.get('contentId');
    const isContentCached = await this._store.existKey(`${CACHE_KEYS.CONTENT}:${contentId}`);
    if (!isContentCached) {
      return;
    }

    const quizDto = this._quizMapper.toDto(quiz);
    await this._store.setJson(`${CACHE_KEYS.CONTENT}:${contentId}`, quizDto, 'quiz');
  }

  public async deleteQuiz(contentId: string): Promise<void> {
    const isContentCached = await this._store.existKey(`${CACHE_KEYS.CONTENT}:${contentId}`);
    if (!isContentCached) {
      return;
    }
    await this._store.setJson(`${CACHE_KEYS.CONTENT}:${contentId}`, null, 'quiz');
  }
}
