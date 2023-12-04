import { CONTENT_TYPE } from '@beincom/constants';

import { ReactionDto } from '../../../../v2-post/application/dto';

export const REACTION_EVENT_APPLICATION_SERVICE = 'REACTION_EVENT_APPLICATION_SERVICE';

export type ReactionToContentEventPayload = {
  event: string;
  recipients: string[];
  reaction: ReactionDto;
  contentType: CONTENT_TYPE;
  contentId: string;
};

export type ReactionToCommentEventPayload = {
  event: string;
  recipients: string[];
  reaction: ReactionDto;
  contentId: string;
  contentType: CONTENT_TYPE;
  commentId: string;
  parentId: string;
};

export interface IReactionEventApplicationService {
  emitReactionToPostEvent(payload: ReactionToContentEventPayload): Promise<void>;
  emitReactionToArticleEvent(payload: ReactionToContentEventPayload): Promise<void>;
  emitReactionToCommentEvent(payload: ReactionToCommentEventPayload): Promise<void>;
}
