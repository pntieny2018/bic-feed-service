import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { KafkaService } from '@app/kafka';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { QuizRegenerateEvent } from '../../domain/event/quiz-regenerate.event';
import { Logger } from '@nestjs/common';
import { QuizGeneratedEventHandler } from './quiz-generated.event-handler';

@EventsHandler(QuizRegenerateEvent)
export class QuizRegenerateEventHandler implements IEventHandler<QuizRegenerateEvent> {
  private readonly _logger = new Logger(QuizGeneratedEventHandler.name);
  public constructor(private readonly _kafkaService: KafkaService) {}

  public async handle(event: QuizRegenerateEvent): Promise<void> {
    this._logger.log(`EventHandler: ${JSON.stringify(event)}`);
    const { quizId } = event;
    this._kafkaService.emit(KAFKA_TOPIC.CONTENT.QUIZ_WAITING, {
      quizId,
    });
  }
}
