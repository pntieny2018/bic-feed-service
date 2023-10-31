import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { QuizGeneratedEvent } from '../../../domain/event';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IQuizRepository,
  QUIZ_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { IWebsocketAdapter, WEBSOCKET_ADAPTER } from '../../../domain/service-adapter-interface';

@EventsHandlerAndLog(QuizGeneratedEvent)
export class WsQuizGeneratedEventHandler implements IEventHandler<QuizGeneratedEvent> {
  public constructor(
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(WEBSOCKET_ADAPTER)
    private readonly _websocketAdapter: IWebsocketAdapter
  ) {}

  public async handle(event: QuizGeneratedEvent): Promise<void> {
    const { quizId } = event.payload;
    const quizEntity = await this._quizRepository.findQuizById(quizId);
    if (!quizEntity) {
      return;
    }

    const contentEntity = await this._contentRepository.findContentById(
      quizEntity.get('contentId')
    );

    if (!contentEntity) {
      return;
    }

    await this._websocketAdapter.emitQuizProcessedEvent({
      event: QuizGeneratedEvent.event,
      recipients: [quizEntity.get('createdBy')],
      quizId: quizEntity.get('id'),
      genStatus: quizEntity.get('genStatus'),
    });
  }
}
