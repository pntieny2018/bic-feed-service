import { PostEntity } from '../model/post';

export type CreateDraftPostProps = {
  id: string;
  groupIds: string[];
};

enum PostAttribute {
  ID = 'id',
  TITLE = 'title',
}

export interface IPostRepository {
  createDraftPost(data: PostEntity): Promise<void>;

  findOne(id: string, attributes?: PostAttribute): Promise<PostEntity>;

  delete(id: string): Promise<void>;
}

export const POST_REPOSITORY_TOKEN = 'POST_REPOSITORY_TOKEN';
