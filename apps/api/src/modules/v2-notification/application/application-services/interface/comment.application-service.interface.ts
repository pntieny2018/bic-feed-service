import { UserDto } from '@libs/service/user';

import { ArticleDto, CommentBaseDto, PostDto } from '../../../../v2-post/application/dto';
import { CommentRecipientDto, ReplyCommentRecipientDto } from '../../dto';

export const COMMENT_NOTIFICATION_APPLICATION_SERVICE = 'COMMENT_NOTIFICATION_APPLICATION_SERVICE';

export type CommentNotificationPayload = {
  event: string;
  actor: UserDto;
  comment: CommentBaseDto;
  content: PostDto | ArticleDto;
  parentComment?: CommentBaseDto;
  commentRecipient?: CommentRecipientDto;
  replyCommentRecipient?: ReplyCommentRecipientDto;
  prevCommentActivities?: CommentBaseDto[];
};

export interface ICommentNotificationApplicationService {
  sendCommentNotification(payload: CommentNotificationPayload): Promise<void>;
}
