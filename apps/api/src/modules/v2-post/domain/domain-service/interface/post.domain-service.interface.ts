import { PostEntity } from '../../model/post';

export type PostCreateProps = {
  name: string;
  groupIds: string;
  userId: string;
};

export interface IPostDomainService {
  createDraftPost(data: PostCreateProps): Promise<PostEntity>;

  deletePost(id: string): Promise<void>;
}

export const POST_DOMAIN_SERVICE_TOKEN = 'POST_DOMAIN_SERVICE_TOKEN';
