import { PostEntity } from '../model/post';
import { PostType } from '../../data-type';
import { IPost } from '../../../../database/models/post.model';
import { ArticleEntity } from '../model/post/article.entity';
import { SeriesEntity } from '../model/post/series.entity';

export type FindOnePostOptions = {
  where: {
    id: string;
    groupArchived?: boolean;
  };
  include?: {
    shouldIncludeGroup?: boolean;
    mustIncludeGroup?: boolean;
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
    shouldIncludeGroup?: boolean;
    mustIncludeGroup?: boolean;
  };
  attributes?: (keyof IPost)[];
};

export interface IPostRepository {
  createPost(data: PostEntity): Promise<void>;
  updatePost(data: PostEntity): Promise<void>;
  findOne(
    findOnePostOptions: FindOnePostOptions
  ): Promise<PostEntity | ArticleEntity | SeriesEntity>;

  findAll(
    findAllPostOptions: FindAllPostOptions
  ): Promise<PostEntity[] | ArticleEntity[] | SeriesEntity[]>;

  delete(id: string): Promise<void>;
}

export const POST_REPOSITORY_TOKEN = 'POST_REPOSITORY_TOKEN';
