import { CommentEntity } from '../../model/Comment';
import { FileProps, ImageProps, VideoProps } from '../../model/media';

export type CreateCommentProps = {
  userId: string;
  postId: string;
  content?: string;
  giphyId?: string;
  media?: { images?: ImageProps[]; videos?: VideoProps[]; files?: FileProps[] };
};

export interface ICommentFactory {
  createComment(props: CreateCommentProps): CommentEntity;
}

export const COMMENT_FACTORY_TOKEN = 'COMMENT_FACTORY_TOKEN';
