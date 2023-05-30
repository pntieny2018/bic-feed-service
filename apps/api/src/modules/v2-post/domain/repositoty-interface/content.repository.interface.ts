import { PostEntity } from '../model/content';
import { PostType } from '../../data-type';
import { IPost } from '../../../../database/models/post.model';
import { ArticleEntity } from '../model/content/article.entity';
import { SeriesEntity } from '../model/content/series.entity';

export type FindOnePostOptions = {
  where: {
    id: string;
    groupArchived?: boolean;
    isHidden?: boolean;
    excludeReportedByUserId?: string;
  };
  include?: {
    mustIncludeGroup?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeSeries?: boolean;
    shouldIncludeTag?: boolean;
    shouldIncludeCategory?: boolean;
    shouldIncludeLinkPreview?: boolean;
    shouldIncludeReactionUserId?: string;
    shouldIncludeSavedUserId?: string;
    shouldIncludeMarkReadImportantUserId?: string;
  };
  attributes?: (keyof IPost)[];
};

export type FindAllPostOptions = {
  where: {
    type?: PostType;
    ids?: string[];
    groupArchived?: boolean;
    excludeReportedByUserId?: string;
  };
  include?: {
    mustIncludeGroup?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeSeries?: boolean;
    shouldIncludeTag?: boolean;
    shouldIncludeCategory?: boolean;
    shouldIncludeLinkPreview?: boolean;
    shouldIncludeReactionUserId?: string;
    shouldIncludeSavedUserId?: string;
    shouldIncludeMarkReadImportantUserId?: string;
  };
  attributes?: (keyof IPost)[];
};

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
}

export const CONTENT_REPOSITORY_TOKEN = 'CONTENT_REPOSITORY_TOKEN';
