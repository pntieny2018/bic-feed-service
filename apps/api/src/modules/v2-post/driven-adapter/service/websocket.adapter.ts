import { Inject, Injectable } from '@nestjs/common';

import {
  COMMENT_EVENT_APPLICATION_SERVICE,
  IQuizEventApplicationService,
  IReactionEventApplicationService,
  QUIZ_EVENT_APPLICATION_SERVICE,
  REACTION_EVENT_APPLICATION_SERVICE,
  ICommentEventApplicationService,
  QuizProcessedEventPayload,
  ReactionToContentEventPayload,
  ReactionToCommentEventPayload,
  CommentCreatedEventPayload,
  POST_EVENT_APPLICATION_SERVICE,
  IPostEventApplicationService,
  PostVideoProcessedEventPayload,
} from '../../../ws/application/application-services/interface';
import { IWebsocketAdapter } from '../../domain/service-adapter-interface';

@Injectable()
export class WebsocketAdapter implements IWebsocketAdapter {
  public constructor(
    @Inject(QUIZ_EVENT_APPLICATION_SERVICE)
    private readonly _quizWebsocketApp: IQuizEventApplicationService,
    @Inject(REACTION_EVENT_APPLICATION_SERVICE)
    private readonly _reactionWebsocketApp: IReactionEventApplicationService,
    @Inject(COMMENT_EVENT_APPLICATION_SERVICE)
    private readonly __commmentWebsocketApp: ICommentEventApplicationService,
    @Inject(POST_EVENT_APPLICATION_SERVICE)
    private readonly __postWebsocketApp: IPostEventApplicationService
  ) {}

  public async emitQuizProcessedEvent(payload: QuizProcessedEventPayload): Promise<void> {
    return this._quizWebsocketApp.emitQuizProcessedEvent(payload);
  }

  public async emitReactionToPostEvent(payload: ReactionToContentEventPayload): Promise<void> {
    return this._reactionWebsocketApp.emitReactionToPostEvent(payload);
  }

  public async emitReactionToArticleEvent(payload: ReactionToContentEventPayload): Promise<void> {
    return this._reactionWebsocketApp.emitReactionToArticleEvent(payload);
  }

  public async emitReactionToCommentEvent(payload: ReactionToCommentEventPayload): Promise<void> {
    return this._reactionWebsocketApp.emitReactionToCommentEvent(payload);
  }

  public async emitCommentCreatedEvent(payload: CommentCreatedEventPayload): Promise<void> {
    return this.__commmentWebsocketApp.emitCommentCreatedEvent(payload);
  }

  public async emitPostVideoProcessedEvent(payload: PostVideoProcessedEventPayload): Promise<void> {
    return this.__postWebsocketApp.emitPostVideoProcessedEvent(payload);
  }
}
