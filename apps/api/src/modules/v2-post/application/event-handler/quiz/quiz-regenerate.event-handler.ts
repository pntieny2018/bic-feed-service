import { IQueueService, QUEUE_SERVICE_TOKEN } from '@libs/infra/queue';
import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { QuizRegenerateEvent } from '../../../domain/event';

import { QuizGeneratedEventHandler } from './quiz-generated.event-handler';

@EventsHandler(QuizRegenerateEvent)
export class QuizRegenerateEventHandler implements IEventHandler<QuizRegenerateEvent> {
  private readonly _logger = new Logger(QuizGeneratedEventHandler.name);
  public constructor(
    @Inject(QUEUE_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {}

  public async handle(event: QuizRegenerateEvent): Promise<void> {
    this._logger.log(`EventHandler: ${JSON.stringify(event)}`);
    const { quizId } = event;
    await this._queueService.addQuizJob({
      quizId,
    });
  }
}
