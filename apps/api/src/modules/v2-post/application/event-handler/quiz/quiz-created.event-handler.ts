import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { QuizCreatedEvent } from '../../../domain/event';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../../domain/infra-adapter-interface';

@EventsHandlerAndLog(QuizCreatedEvent)
export class QuizCreatedEventHandler implements IEventHandler<QuizCreatedEvent> {
  public constructor(
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter
  ) {}

  public async handle(event: QuizCreatedEvent): Promise<void> {
    const { quizId } = event.payload;
    await this._queueAdapter.addQuizGenerateJob(quizId);
  }
}
