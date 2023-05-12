import { PostEntity } from '../model/post';

enum PostAttribute {
  ID = 'id',
  TITLE = 'title',
}

export type FindPostOptions = {
  shouldIncludeGroup?: boolean;
  mustIncludeGroup?: boolean;
};

export interface IPostRepository {
  createPost(data: PostEntity): Promise<void>;

  findOne(id: string, options?: FindPostOptions, attributes?: PostAttribute): Promise<PostEntity>;

  delete(id: string): Promise<void>;
}

export const POST_REPOSITORY_TOKEN = 'POST_REPOSITORY_TOKEN';
