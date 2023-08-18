import { QueueService } from '@app/queue';
import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { QuizRegenerateEvent } from '../../../domain/event/quiz-regenerate.event';

import { QuizGeneratedEventHandler } from './quiz-generated.event-handler';

@EventsHandler(QuizRegenerateEvent)
export class QuizRegenerateEventHandler implements IEventHandler<QuizRegenerateEvent> {
  private readonly _logger = new Logger(QuizGeneratedEventHandler.name);
  public constructor(private readonly _queueService: QueueService) {}

  public async handle(event: QuizRegenerateEvent): Promise<void> {
    this._logger.log(`EventHandler: ${JSON.stringify(event)}`);
    const { quizId } = event;
    await this._queueService.addQuizJob({
      quizId,
    });
  }
}
