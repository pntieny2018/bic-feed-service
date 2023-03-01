import { PostReactionEntity } from '../model/reaction';

export type FindOnePostReactionProps = {
  reactionName: string;
  createdBy: string;
  postId: string;
};

export interface IPostReactionRepository {
  // findAll(input: FindAllReactionsProps): Promise<ReactionEntity[]>;

  findOne(input: FindOnePostReactionProps): Promise<PostReactionEntity>;

  create(data: PostReactionEntity): Promise<void>;

  delete(id: string): Promise<void>;
}

export const POST_REACTION_REPOSITORY_TOKEN = 'POST_REACTION_REPOSITORY_TOKEN';
