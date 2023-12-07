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

export type ChildCommentCreatedNotificationPayload = {
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

export type ChildCommentUpdatedNotificationPayload = {
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
  sendChildCommentCreatedNotification(
    payload: ChildCommentCreatedNotificationPayload
  ): Promise<void>;
  sendCommentUpdatedNotification(payload: CommentUpdatedNotificationPayload): Promise<void>;
  sendChildCommentUpdatedNotification(
    payload: ChildCommentUpdatedNotificationPayload
  ): Promise<void>;
  sendCommentDeletedNotification(payload: CommentDeletedNotificationPayload): Promise<void>;
}
