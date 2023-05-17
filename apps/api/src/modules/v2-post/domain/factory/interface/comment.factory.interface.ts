import { FileDto, ImageDto, VideoDto } from '../../../application/dto';
import { CommentEntity, CommentProps } from '../../model/comment';

export type CreateCommentProps = {
  userId: string;
  postId: string;
  parentId?: string;
  content?: string;
  giphyId?: string;
  media?: { images?: ImageDto[]; videos?: VideoDto[]; files?: FileDto[] };
  mentions?: string[];
};

export interface ICommentFactory {
  createComment(props: CreateCommentProps): CommentEntity;

  reconstitute(props: CommentProps): CommentEntity;
}

export const COMMENT_FACTORY_TOKEN = 'COMMENT_FACTORY_TOKEN';
