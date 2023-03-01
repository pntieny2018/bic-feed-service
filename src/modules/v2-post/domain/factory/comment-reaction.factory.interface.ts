import { CommentReactionEntity, CommentReactionProps } from '../model/reaction';

export type CreateReactionOptions = Readonly<{
  commentId: string;
  reactionName: string;
  createdBy: string;
}>;
export interface ICommentReactionFactory {
  create(options: CreateReactionOptions): CommentReactionEntity;
  reconstitute(props: CommentReactionProps): CommentReactionEntity;
}
export const COMMENT_REACTION_FACTORY_TOKEN = 'COMMENT_REACTION_FACTORY_TOKEN';
