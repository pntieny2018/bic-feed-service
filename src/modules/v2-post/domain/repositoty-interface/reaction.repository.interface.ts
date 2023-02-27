import { ReactionEntity } from '../model/reaction';

export type FindAllReactionsProps = {
  postIds: string[];
};

export interface IReactionRepository {
  findAll(input: FindAllReactionsProps): Promise<ReactionEntity[]>;

  update(data: ReactionEntity): Promise<void>;

  create(data: ReactionEntity): Promise<void>;

  delete(id: string): Promise<void>;
}

export const REACTION_REPOSITORY_TOKEN = 'REACTION_REPOSITORY_TOKEN';
