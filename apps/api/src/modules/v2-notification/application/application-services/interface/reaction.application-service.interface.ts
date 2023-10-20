import { UserDto } from '@libs/service/user';

import { ArticleDto, PostDto, ReactionDto } from '../../../../v2-post/application/dto';
import { CommentResponseDto } from '../../../../v2-post/driving-apdater/dto/response';

export const REACTION_NOTIFICATION_APPLICATION_SERVICE =
  'REACTION_NOTIFICATION_APPLICATION_SERVICE';

export type ReactionNotificationPayload = {
  event: string;
  actor: UserDto;
  content: PostDto | ArticleDto;
  reaction: ReactionDto;
  comment?: CommentResponseDto;
  parentComment?: CommentResponseDto;
};

export interface IReactionNotificationApplicationService {
  sendReactionNotification(payload: ReactionNotificationPayload): Promise<void>;
}
