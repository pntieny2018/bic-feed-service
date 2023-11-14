import { UserDto } from '@libs/service/user';

import {
  ArticleDto,
  CommentBaseDto,
  CommentExtendedDto,
  PostDto,
} from '../../../../v2-post/application/dto';
import { CommentRecipientDto, ReplyCommentRecipientDto } from '../../dto';

export const COMMENT_NOTIFICATION_APPLICATION_SERVICE = 'COMMENT_NOTIFICATION_APPLICATION_SERVICE';

export type CommentCreatedNotificationPayload = {
  actor: UserDto;
  comment: CommentBaseDto;
  content: PostDto | ArticleDto;
  commentRecipient: CommentRecipientDto;
  prevCommentActivities: CommentExtendedDto[];
};

export type CommentReplyCreatedNotificationPayload = {
  actor: UserDto;
  comment: CommentBaseDto;
  content: PostDto | ArticleDto;
  parentComment: CommentBaseDto;
  replyCommentRecipient: ReplyCommentRecipientDto;
};

export type CommentUpdatedNotificationPayload = {
  actor: UserDto;
  comment: CommentBaseDto;
  content: PostDto | ArticleDto;
  commentRecipient: CommentRecipientDto;
};

export type CommentReplyUpdatedNotificationPayload = {
  actor: UserDto;
  comment: CommentBaseDto;
  content: PostDto | ArticleDto;
  parentComment: CommentBaseDto;
  replyCommentRecipient: ReplyCommentRecipientDto;
};

export type CommentDeletedNotificationPayload = {
  actor: UserDto;
  content: PostDto | ArticleDto;
  comment: CommentBaseDto;
};

export interface ICommentNotificationApplicationService {
  sendCommentCreatedNotification(payload: CommentCreatedNotificationPayload): Promise<void>;
  sendCommentReplyCreatedNotification(
    payload: CommentReplyCreatedNotificationPayload
  ): Promise<void>;
  sendCommentUpdatedNotification(payload: CommentUpdatedNotificationPayload): Promise<void>;
  sendCommentReplyUpdatedNotification(
    payload: CommentReplyUpdatedNotificationPayload
  ): Promise<void>;
  sendCommentDeletedNotification(payload: CommentDeletedNotificationPayload): Promise<void>;
}
