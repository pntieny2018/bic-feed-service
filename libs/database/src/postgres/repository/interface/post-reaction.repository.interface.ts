import { PostReactionAttributes, PostReactionModel } from '@libs/database/postgres/model';

export type FindOnePostReactionProps = {
  reactionName?: string;
  createdBy?: string;
  postId?: string;
  id?: string;
};

export interface ILibPostReactionRepository {
  findOne(input: FindOnePostReactionProps): Promise<PostReactionModel>;

  create(data: PostReactionAttributes): Promise<void>;

  delete(id: string): Promise<void>;
}

export const LIB_POST_REACTION_REPOSITORY_TOKEN = 'LIB_POST_REACTION_REPOSITORY_TOKEN';
