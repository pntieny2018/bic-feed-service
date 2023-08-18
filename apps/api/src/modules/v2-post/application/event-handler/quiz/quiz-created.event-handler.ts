import { QueueService } from '@app/queue';
import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { QuizCreatedEvent } from '../../../domain/event/quiz-created.event';

@EventsHandler(QuizCreatedEvent)
export class QuizCreatedEventHandler implements IEventHandler<QuizCreatedEvent> {
  private readonly _logger = new Logger(QuizCreatedEventHandler.name);
  public constructor(private readonly _queueService: QueueService) {}

  public async handle(event: QuizCreatedEvent): Promise<void> {
    this._logger.log(`EventHandler: ${JSON.stringify(event)}`);
    const { quizId } = event;
    await this._queueService.addQuizJob({
      quizId,
    });
  }
}
