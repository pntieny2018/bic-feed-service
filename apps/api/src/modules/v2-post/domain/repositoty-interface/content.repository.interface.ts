import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { IPost } from '../../../../database/models/post.model';
import { PostStatus, PostType } from '../../data-type';
import { PostEntity } from '../model/content';
import { ArticleEntity } from '../model/content/article.entity';
import { ContentEntity } from '../model/content/content.entity';
import { SeriesEntity } from '../model/content/series.entity';

export type OrderOptions = {
  isImportantFirst?: boolean;
  isPublishedByDesc?: boolean;
};

export type FindContentProps = {
  where: {
    type?: PostType;
    id?: string;
    ids?: string[];
    groupArchived?: boolean;
    excludeReportedByUserId?: string;
    groupIds?: string[];
    createdBy?: string;
    isImportant?: boolean;
    scheduledAt?: Date;
    isHidden?: boolean;
    savedByUserId?: string;
    status?: PostStatus;
    inNewsfeedUserId?: string;
  };
  include?: {
    mustIncludeGroup?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeSeries?: boolean;
    shouldIncludeItems?: boolean;
    shouldIncludeCategory?: boolean;
    shouldIncludeQuiz?: boolean;
    shouldIncludeLinkPreview?: boolean;
    shouldIncludeReaction?: {
      userId?: string;
    };
    shouldIncludeSaved?: {
      userId?: string;
    };
    shouldIncludeMarkReadImportant?: {
      userId: string;
    };
    shouldIncludeImportant?: {
      userId: string;
    };
  };
  attributes?: { exclude?: (keyof IPost)[] };
  orderOptions?: OrderOptions;
};

export type GetPaginationContentsProps = FindContentProps & CursorPaginationProps;

export interface IContentRepository {
  create(data: PostEntity | ArticleEntity | SeriesEntity): Promise<void>;
  update(data: ContentEntity): Promise<void>;
  findOne(findOnePostOptions: FindContentProps): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  getContentById(contentId: string): Promise<PostEntity | ArticleEntity | SeriesEntity>;
  findAll(
    findAllPostOptions: FindContentProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]>;

  delete(id: string): Promise<void>;
  markSeen(postId: string, userId: string): Promise<void>;
  markReadImportant(postId: string, userId: string): Promise<void>;
  getPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;
}

export const CONTENT_REPOSITORY_TOKEN = 'CONTENT_REPOSITORY_TOKEN';
