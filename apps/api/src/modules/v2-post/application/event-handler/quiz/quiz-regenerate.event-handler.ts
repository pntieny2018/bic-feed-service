import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { QuizRegenerateEvent } from '../../../domain/event';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../../domain/infra-adapter-interface';

@EventsHandlerAndLog(QuizRegenerateEvent)
export class QuizRegenerateEventHandler implements IEventHandler<QuizRegenerateEvent> {
  public constructor(
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter
  ) {}

  public async handle(event: QuizRegenerateEvent): Promise<void> {
    const { quizId } = event.payload;
    await this._queueAdapter.addQuizGenerateJob(quizId);
  }
}
