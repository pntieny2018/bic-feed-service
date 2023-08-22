import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { QuizRegenerateEvent } from '../../domain/event/quiz-regenerate.event';
import { Logger } from '@nestjs/common';
import { QuizGeneratedEventHandler } from './quiz-generated.event-handler';
import { QueueService } from '@app/queue';

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
