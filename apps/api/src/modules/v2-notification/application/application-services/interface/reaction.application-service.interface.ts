import { UserDto } from '@libs/service/user';

import {
  ArticleDto,
  CommentExtendedDto,
  PostDto,
  ReactionDto,
} from '../../../../v2-post/application/dto';

export const REACTION_NOTIFICATION_APPLICATION_SERVICE =
  'REACTION_NOTIFICATION_APPLICATION_SERVICE';

export type ReactionContentNotificationPayload = {
  event: string;
  actor: UserDto;
  content: PostDto | ArticleDto;
  reaction: ReactionDto;
};

export type ReactionCommentNotificationPayload = {
  event: string;
  actor: UserDto;
  content: PostDto | ArticleDto;
  reaction: ReactionDto;
  comment: CommentExtendedDto;
};

export type ReactionReplyCommentNotificationPayload = {
  event: string;
  actor: UserDto;
  content: PostDto | ArticleDto;
  reaction: ReactionDto;
  comment: CommentExtendedDto;
  parentComment: CommentExtendedDto;
};

export interface IReactionNotificationApplicationService {
  sendReactionContentNotification(payload: ReactionContentNotificationPayload): Promise<void>;
  sendReactionCommentNotification(payload: ReactionCommentNotificationPayload): Promise<void>;
  sendReactionReplyCommentNotification(
    payload: ReactionReplyCommentNotificationPayload
  ): Promise<void>;
}
