import { CommentEntity, CommentAttributes } from '../../model/comment';

export type BasedCommentProps = {
  userId: string;
  postId: string;
  parentId?: string;
  content?: string;
  giphyId?: string;
  media?: {
    files: string[];
    images: string[];
    videos: string[];
  };
  mentions?: string[];
};

export interface ICommentFactory {
  createComment(props: BasedCommentProps): CommentEntity;

  reconstitute(props: CommentAttributes): CommentEntity;
}

export const COMMENT_FACTORY_TOKEN = 'COMMENT_FACTORY_TOKEN';
