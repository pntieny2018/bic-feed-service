import { PostEntity, PostProps } from '../../model/post';

export interface IPostFactory {
  createDraftPost(props: { groupIds: string[]; userId: string }): PostEntity;

  reconstitute(props: PostProps): PostEntity;
}

export const POST_FACTORY_TOKEN = 'POST_FACTORY_TOKEN';
