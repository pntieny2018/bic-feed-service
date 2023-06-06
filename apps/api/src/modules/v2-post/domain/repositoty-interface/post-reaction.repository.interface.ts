import { ReactionEntity } from '../model/reaction';

export type FindOnePostReactionProps = {
  reactionName?: string;
  createdBy?: string;
  postId?: string;
  id?: string;
};

export interface IPostReactionRepository {
  findOne(input: FindOnePostReactionProps): Promise<ReactionEntity>;

  create(data: ReactionEntity): Promise<void>;

  delete(id: string): Promise<void>;
}

export const POST_REACTION_REPOSITORY_TOKEN = 'POST_REACTION_REPOSITORY_TOKEN';
