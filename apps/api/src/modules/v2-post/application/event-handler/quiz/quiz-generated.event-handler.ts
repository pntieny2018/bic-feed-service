import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../../common/constants';
import { QuizGeneratedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IQuizRepository,
  QUIZ_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';

@EventsHandler(QuizGeneratedEvent)
export class QuizGeneratedEventHandler implements IEventHandler<QuizGeneratedEvent> {
  private readonly _logger = new Logger(QuizGeneratedEventHandler.name);
  public constructor(
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: QuizGeneratedEvent): Promise<void> {
    this._logger.log(`EventHandler: ${JSON.stringify(event)}`);
    const { quizId } = event;
    const quizEntity = await this._quizRepository.findOne(quizId);
    if (!quizEntity) {
      return;
    }

    const contentEntity = await this._contentRepository.findOne({
      where: { id: quizEntity.get('contentId') },
    });

    if (!contentEntity) {
      return;
    }

    this._kafkaAdapter.emit(KAFKA_TOPIC.CONTENT.QUIZ_PROCESSED, {
      contentId: quizEntity.get('contentId'),
      contentType: contentEntity.getType(),
      quizId: quizEntity.get('id'),
      genStatus: quizEntity.get('genStatus'),
      createdBy: quizEntity.get('createdBy'),
    });
  }
}
