import {
  ArticleCacheDto,
  PostCacheDto,
  ReactionCount,
  SeriesCacheDto,
} from '@api/modules/v2-post/application/dto';
import { ArticleEntity, PostEntity, SeriesEntity } from '@api/modules/v2-post/domain/model/content';
import { QuizEntity } from '@api/modules/v2-post/domain/model/quiz';

export interface IContentCacheRepository {
  existKey(key: string): Promise<boolean>;

  getContent(contentId: string): Promise<PostCacheDto | ArticleCacheDto | SeriesCacheDto>;
  getContents(contentIds: string[]): Promise<(PostCacheDto | ArticleCacheDto | SeriesCacheDto)[]>;
  setContents(contents: (PostEntity | ArticleEntity | SeriesEntity)[]): Promise<void>;
  deleteContent(contentId: string): Promise<void>;

  getReportedTargetIdsByUserId(userId: string): Promise<string[]>;
  cacheUserReportedContent(userId: string, contentIds: string[]): Promise<void>;

  setReactionsCount(contentId: string, reactionsCount: ReactionCount): Promise<void>;
  setReactionNameNx(contentId: string, reactionName: string): Promise<any>;
  increaseReactionsCount(contentId: string, reactionName: string): Promise<number>;
  decreaseReactionsCount(contentId: string, reactionName: string): Promise<number>;

  increaseCommentCount(contentId: string): Promise<void>;
  decreaseCommentCount(contentId: string, decrease?: number): Promise<void>;

  increaseSeenContentCount(contentId: string): Promise<void>;

  updateQuiz(quiz: QuizEntity): Promise<void>;
  deleteQuiz(contentId: string): Promise<void>;
}

export const CONTENT_CACHE_REPOSITORY_TOKEN = 'CONTENT_CACHE_REPOSITORY_TOKEN';
