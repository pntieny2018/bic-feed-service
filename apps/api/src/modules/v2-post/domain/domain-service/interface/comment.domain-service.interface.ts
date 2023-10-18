import { CursorPaginationResult } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';

import {
  CommentRecipientDto,
  ReplyCommentRecipientDto,
} from '../../../../v2-notification/application/dto';
import { ArticleDto, PostDto } from '../../../application/dto';
import { CommentEntity } from '../../model/comment';

export type BasedCommentPayload = {
  userId: string;
  contentId: string;
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

export type CreateCommentProps = BasedCommentPayload & {
  actor: UserDto;
};

export type UpdateCommentProps = BasedCommentPayload & { commentId: string; actor: UserDto };

export type GetCommentsAroundIdProps = {
  userId?: string;
  limit: number;
  targetChildLimit: number;
};

export type DissociateCommentProps = {
  commentId: string;
  userId: string;
  contentDto: PostDto | ArticleDto;
  cb?: (comment: CommentEntity[]) => void;
};

export interface ICommentDomainService {
  getVisibleComment(id: string, excludeReportedByUserId?: string): Promise<CommentEntity>;

  getCommentsAroundId(
    id: string,
    props: GetCommentsAroundIdProps
  ): Promise<CursorPaginationResult<CommentEntity>>;

  create(data: CreateCommentProps): Promise<CommentEntity>;

  update(input: UpdateCommentProps): Promise<void>;

  delete(comment: CommentEntity, actor: UserDto): Promise<void>;

  dissociateComment(
    props: DissociateCommentProps
  ): Promise<CommentRecipientDto | ReplyCommentRecipientDto>;
}
export const COMMENT_DOMAIN_SERVICE_TOKEN = 'COMMENT_DOMAIN_SERVICE_TOKEN';
