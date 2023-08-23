import { IQueueService, QUEUE_SERVICE_TOKEN } from '@libs/infra/queue';
import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { QuizCreatedEvent } from '../../../domain/event';

@EventsHandler(QuizCreatedEvent)
export class QuizCreatedEventHandler implements IEventHandler<QuizCreatedEvent> {
  private readonly _logger = new Logger(QuizCreatedEventHandler.name);
  public constructor(
    @Inject(QUEUE_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {}

  public async handle(event: QuizCreatedEvent): Promise<void> {
    this._logger.log(`EventHandler: ${JSON.stringify(event)}`);
    const { quizId } = event;
    await this._queueService.addQuizJob({
      quizId,
    });
  }
}
