import { PostEntity } from '../../model/post';

export type PostCreateProps = {
  name: string;
  groupId: string;
  userId: string;
};

export type PostUpdateProps = {
  name: string;
  id: string;
  userId: string;
};

export interface IPostDomainService {
  createDraftPost(data: PostCreateProps): Promise<PostEntity>;

  updatePost(tag: PostEntity, data: PostUpdateProps): Promise<PostEntity>;

  deletePost(id: string): Promise<void>;
}

export const POST_DOMAIN_SERVICE_TOKEN = 'POST_DOMAIN_SERVICE_TOKEN';
