import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { KafkaService } from '@app/kafka';
import { KAFKA_TOPIC } from '../../../../common/constants';
import { QuizCreatedEvent } from '../../domain/event/quiz-created.event';
import { Logger } from '@nestjs/common';

@EventsHandler(QuizCreatedEvent)
export class QuizCreatedEventHandler implements IEventHandler<QuizCreatedEvent> {
  private readonly _logger = new Logger(QuizCreatedEventHandler.name);
  public constructor(private readonly _kafkaService: KafkaService) {}

  public async handle(event: QuizCreatedEvent): Promise<void> {
    this._logger.log(`EventHandler: ${JSON.stringify(event)}`);
    const { quizId } = event;
    this._kafkaService.emit(KAFKA_TOPIC.CONTENT.QUIZ_WAITING, {
      quizId,
    });
  }
}
