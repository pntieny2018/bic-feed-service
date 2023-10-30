import { Inject } from '@nestjs/common';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { QuizProcessedEvent, QuizProcessedEventData } from '../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';

import { IQuizEventApplicationService, QuizProcessedEventPayload } from './interface';

export class QuizEventApplicationService implements IQuizEventApplicationService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async emitQuizProcessedEvent(payload: QuizProcessedEventPayload): Promise<void> {
    const { quizId, description, genStatus, recipients } = payload;

    const event = new QuizProcessedEvent({
      rooms: recipients,
      data: new QuizProcessedEventData({ quizId, description, genStatus }),
    });

    await this._kafkaAdapter.emit<QuizProcessedEvent>(
      KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT,
      event
    );
  }
}
