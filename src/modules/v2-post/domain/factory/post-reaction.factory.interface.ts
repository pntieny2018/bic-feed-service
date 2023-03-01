import { PostReactionEntity, PostReactionProps } from '../model/reaction';

export type CreatePostReactionOptions = Readonly<{
  postId: string;
  reactionName: string;
  createdBy: string;
}>;
export interface IPostReactionFactory {
  create(options: CreatePostReactionOptions): PostReactionEntity;
  reconstitute(props: PostReactionProps): PostReactionEntity;
}
export const POST_REACTION_FACTORY_TOKEN = 'POST_REACTION_FACTORY_TOKEN';
