import { UserDto } from '@libs/service/user';

import {
  ArticleDto,
  CommentExtendedDto,
  PostDto,
  ReactionDto,
} from '../../../../v2-post/application/dto';

export const REACTION_NOTIFICATION_APPLICATION_SERVICE =
  'REACTION_NOTIFICATION_APPLICATION_SERVICE';

export type ReactionNotificationPayload = {
  event: string;
  actor: UserDto;
  content: PostDto | ArticleDto;
  reaction: ReactionDto;
  comment?: CommentExtendedDto;
  parentComment?: CommentExtendedDto;
};

export interface IReactionNotificationApplicationService {
  sendReactionNotification(payload: ReactionNotificationPayload): Promise<void>;
}
