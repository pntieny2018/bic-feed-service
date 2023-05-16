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
  };
  include?: {
    mustIncludeGroup?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeSeries?: boolean;
    shouldIncludeTag?: boolean;
  };
  attributes?: (keyof IPost)[];
};

export type FindAllPostOptions = {
  where: {
    type?: PostType;
    ids?: string[];
    groupArchived?: boolean;
  };
  include?: {
    mustIncludeGroup?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeSeries?: boolean;
    shouldIncludeTag?: boolean;
  };
  attributes?: (keyof IPost)[];
};

export interface IPostRepository {
  upsert(data: PostEntity): Promise<void>;
  findOne(
    findOnePostOptions: FindOnePostOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity>;

  findAll(
    findAllPostOptions: FindAllPostOptions
  ): Promise<PostEntity[] | ArticleEntity[] | SeriesEntity[]>;

  delete(id: string): Promise<void>;
}

export const POST_REPOSITORY_TOKEN = 'POST_REPOSITORY_TOKEN';
