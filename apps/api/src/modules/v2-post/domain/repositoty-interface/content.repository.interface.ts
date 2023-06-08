import { PostEntity } from '../model/content';
import { PostStatus, PostType } from '../../data-type';
import { IPost } from '../../../../database/models/post.model';
import { ArticleEntity } from '../model/content/article.entity';
import { SeriesEntity } from '../model/content/series.entity';
import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';

export type OrderOptions = {
  isImportantFirst?: boolean;
};
export type FindOnePostOptions = {
  where: {
    id: string;
    groupArchived?: boolean;
    isHidden?: boolean;
    excludeReportedByUserId?: string;
    groupId?: string;
    groupIds?: string[];
    createdBy?: string;
    isImportant?: string;
    savedByUserId?: string;
    type?: PostType;
    status?: PostStatus;
    importantWithUserId?: string;
    notImportantWithUserId?: string;
    inNewsfeedUserId?: string;
  };
  include?: {
    mustIncludeGroup?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeSeries?: boolean;
    shouldIncludeCategory?: boolean;
    shouldIncludeLinkPreview?: boolean;
    shouldIncludeItems?: boolean;
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
  attributes?: { exclude?: (keyof IPost)[]; include?: (keyof IPost)[] };
  order?: OrderOptions;
};

export type FindAllPostOptions = {
  where: {
    type?: PostType;
    ids?: string[];
    groupArchived?: boolean;
    excludeReportedByUserId?: string;
    groupId?: string;
    groupIds?: string[];
    createdBy?: string;
    isImportant?: boolean;
    isHidden?: boolean;
    savedByUserId?: string;
    status?: PostStatus;
    importantWithUserId?: string;
    notImportantWithUserId?: string;
    inNewsfeedUserId?: string;
  };
  include?: {
    mustIncludeGroup?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeSeries?: boolean;
    shouldIncludeItems?: boolean;
    shouldIncludeCategory?: boolean;
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
  attributes?: { exclude?: (keyof IPost)[]; include?: (keyof IPost)[] };
  limit?: number;
  offset?: number;
  after?: string;
  order?: OrderOptions;
};

export type GetPaginationContentsProps = FindAllPostOptions & CursorPaginationProps;

export interface IContentRepository {
  create(data: PostEntity | ArticleEntity | SeriesEntity): Promise<void>;
  update(data: PostEntity | ArticleEntity | SeriesEntity): Promise<void>;
  findOne(
    findOnePostOptions: FindOnePostOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity>;

  findAll(
    findAllPostOptions: FindAllPostOptions
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]>;

  delete(id: string): Promise<void>;
  markSeen(postId: string, userId: string): Promise<void>;
  markReadImportant(postId: string, userId: string): Promise<void>;
  getPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;
}

export const CONTENT_REPOSITORY_TOKEN = 'CONTENT_REPOSITORY_TOKEN';
