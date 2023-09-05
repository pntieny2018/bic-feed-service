import { CONTENT_STATUS, CONTENT_TYPE, ORDER } from '@beincom/constants';
import {
  CursorPaginationProps,
  CursorPaginationResult,
  PaginationProps,
} from '@libs/database/postgres/common';
import { PostCategoryAttributes } from '@libs/database/postgres/model/post-category.model';
import { PostGroupAttributes } from '@libs/database/postgres/model/post-group.model';
import { PostSeriesAttributes } from '@libs/database/postgres/model/post-series.model';
import { PostTagAttributes } from '@libs/database/postgres/model/post-tag.model';
import { PostAttributes, PostModel } from '@libs/database/postgres/model/post.model';
import { UserMarkedImportantPostAttributes } from '@libs/database/postgres/model/user-mark-read-post.model';
import { UserSeenPostAttributes } from '@libs/database/postgres/model/user-seen-post.model';
import { BulkCreateOptions, CreateOptions, Transaction, WhereOptions } from 'sequelize';

export type OrderOptions = {
  isImportantFirst?: boolean;
  isPublishedByDesc?: boolean;
  sortColumn?: keyof PostAttributes;
  sortBy?: ORDER;
};

export type FindContentProps = {
  where: {
    type?: CONTENT_TYPE;
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
    status?: CONTENT_STATUS;
    statuses?: CONTENT_STATUS[];
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
  attributes?: { exclude?: (keyof PostAttributes)[] };
  orderOptions?: OrderOptions;
};

export type GetPaginationContentsProps = FindContentProps & CursorPaginationProps;

export interface ILibContentRepository {
  create(data: PostAttributes, options?: CreateOptions): Promise<void>;

  update(
    contentId: string,
    data: Partial<PostAttributes>,
    transaction?: Transaction
  ): Promise<void>;

  bulkCreatePostGroup(
    postGroups: PostGroupAttributes[],
    options?: BulkCreateOptions
  ): Promise<void>;

  destroyPostGroup(
    where: WhereOptions<PostGroupAttributes>,
    transaction?: Transaction
  ): Promise<void>;

  bulkCreatePostSeries(
    postGroups: PostSeriesAttributes[],
    options?: BulkCreateOptions
  ): Promise<void>;

  bulkCreatePostTag(postGroups: PostTagAttributes[], options?: BulkCreateOptions): Promise<void>;

  destroyPostTag(where: WhereOptions<PostTagAttributes>, transaction?: Transaction): Promise<void>;

  bulkCreatePostCategory(
    postGroups: PostCategoryAttributes[],
    options?: BulkCreateOptions
  ): Promise<void>;

  destroyPostCategory(
    where: WhereOptions<PostCategoryAttributes>,
    transaction?: Transaction
  ): Promise<void>;

  bulkCreateSeenPost(
    seenPosts: UserSeenPostAttributes[],
    options?: BulkCreateOptions
  ): Promise<void>;

  bulkCreateReadImportantPost(
    readImportantPosts: UserMarkedImportantPostAttributes[],
    options?: BulkCreateOptions
  ): Promise<void>;

  destroyPostSeries(
    where: WhereOptions<PostSeriesAttributes>,
    transaction?: Transaction
  ): Promise<void>;

  findOne(findOnePostOptions: FindContentProps): Promise<PostModel>;

  findAll(
    findAllPostOptions: FindContentProps,
    offsetPaginate?: PaginationProps
  ): Promise<PostModel[]>;

  delete(id: string): Promise<void>;

  getPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostModel>>;
}

export const LIB_CONTENT_REPOSITORY_TOKEN = 'LIB_CONTENT_REPOSITORY_TOKEN';
