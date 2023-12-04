import {
  QuizProcessedEventPayload,
  ReactionToCommentEventPayload,
  ReactionToContentEventPayload,
  CommentCreatedEventPayload,
  PostVideoProcessedEventPayload,
} from '../../../ws/application/application-services/interface';

export const WEBSOCKET_ADAPTER = 'WEBSOCKET_ADAPTER';

export interface IWebsocketAdapter {
  emitQuizProcessedEvent(payload: QuizProcessedEventPayload): Promise<void>;
  emitReactionToPostEvent(payload: ReactionToContentEventPayload): Promise<void>;
  emitReactionToArticleEvent(payload: ReactionToContentEventPayload): Promise<void>;
  emitReactionToCommentEvent(payload: ReactionToCommentEventPayload): Promise<void>;
  emitCommentCreatedEvent(payload: CommentCreatedEventPayload): Promise<void>;
  emitPostVideoProcessedEvent(payload: PostVideoProcessedEventPayload): Promise<void>;
}
