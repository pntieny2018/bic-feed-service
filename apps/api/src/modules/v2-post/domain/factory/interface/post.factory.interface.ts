import { PostEntity, PostAttributes } from '../../model/content';

export interface IPostFactory {
  createPost(props: { groupIds: string[]; userId: string }): PostEntity;

  reconstitute(props: PostAttributes): PostEntity;
}

export const POST_FACTORY_TOKEN = 'POST_FACTORY_TOKEN';
