import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { QuizGeneratedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IQuizRepository,
  QUIZ_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(QuizGeneratedEvent)
export class QuizGeneratedEventHandler implements IEventHandler<QuizGeneratedEvent> {
  public constructor(
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
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

    this._kafkaAdapter.emit(KAFKA_TOPIC.CONTENT.QUIZ_PROCESSED, {
      key: quizId,
      value: {
        contentId: quizEntity.get('contentId'),
        contentType: contentEntity.getType(),
        quizId: quizEntity.get('id'),
        genStatus: quizEntity.get('genStatus'),
        createdBy: quizEntity.get('createdBy'),
      },
    });
  }
}
