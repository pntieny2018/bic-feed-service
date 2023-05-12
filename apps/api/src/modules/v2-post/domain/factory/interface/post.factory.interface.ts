import { PostEntity, PostProps } from '../../model/post';

export type CreatePostDraftProps = {
  groupIds: string[];
  userId: string;
};

export interface IPostFactory {
  createDraft(props: CreatePostDraftProps): PostEntity;

  reconstitute(props: PostProps): PostEntity;
}

export const POST_FACTORY_TOKEN = 'POST_FACTORY_TOKEN';
