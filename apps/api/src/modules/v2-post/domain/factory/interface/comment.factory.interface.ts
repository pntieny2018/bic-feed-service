import { CommentEntity, CommentProps } from '../../model/comment';
import { FileProps, ImageEntity, ImageProps, VideoProps } from '../../model/media';

export type CreateCommentProps = {
  userId: string;
  postId: string;
  content?: string;
  giphyId?: string;
  media?: { images?: ImageProps[]; videos?: VideoProps[]; files?: FileProps[] };
  mentions?: string[];
};

export interface ICommentFactory {
  createComment(props: CreateCommentProps): CommentEntity;

  reconstitute(props: CommentProps): CommentEntity;
}

export const COMMENT_FACTORY_TOKEN = 'COMMENT_FACTORY_TOKEN';
