import { UserDto } from '@libs/service/user';

import { ArticleDto, CommentDto, PostDto } from '../../../../v2-post/application/dto';
import { CommentActivityObjectDto, CommentRecipientDto, ReplyCommentRecipientDto } from '../../dto';

export const COMMENT_NOTIFICATION_APPLICATION_SERVICE = 'COMMENT_NOTIFICATION_APPLICATION_SERVICE';

export type CommentNotificationPayload = {
  event: string;
  actor: UserDto;
  comment: CommentDto;
  content: PostDto | ArticleDto;
  parentComment?: CommentDto;
  commentRecipient?: CommentRecipientDto;
  replyCommentRecipient?: ReplyCommentRecipientDto;
  prevCommentActivities?: CommentActivityObjectDto[];
};

export interface ICommentNotificationApplicationService {
  sendCommentNotification(payload: CommentNotificationPayload): Promise<void>;
}
