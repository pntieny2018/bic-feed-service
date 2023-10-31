import { Inject } from '@nestjs/common';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { TargetType, VerbActivity } from '../../data-type';
import { QuizProcessedEvent, QuizProcessedEventData } from '../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';

import { IQuizEventApplicationService, QuizProcessedEventPayload } from './interface';

export class QuizEventApplicationService implements IQuizEventApplicationService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async emitQuizProcessedEvent(payload: QuizProcessedEventPayload): Promise<void> {
    const { event: eventName, quizId, contentId, description, genStatus, recipients } = payload;

    const event = new QuizProcessedEvent({
      rooms: recipients,
      data: new QuizProcessedEventData({
        event: eventName,
        verb: VerbActivity.GENERATE_QUIZ,
        target: TargetType.QUIZ,
        extra: {
          quizId,
          contentId,
          description,
          genStatus,
        },
      }),
    });

    await this._kafkaAdapter.emit<QuizProcessedEvent>(
      KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT,
      event
    );
  }
}
