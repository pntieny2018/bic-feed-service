import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { RULES } from '../../../constant';
import { QuizParticipantStartedEvent } from '../../../domain/event';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../../domain/infra-adapter-interface';

@EventsHandlerAndLog(QuizParticipantStartedEvent)
export class QuizParticipantStartedEventHandler
  implements IEventHandler<QuizParticipantStartedEvent>
{
  public constructor(
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter
  ) {}

  public async handle(event: QuizParticipantStartedEvent): Promise<void> {
    const { quizParticipantId, timeLimit } = event.payload;
    const delay = (timeLimit + RULES.QUIZ_TIME_LIMIT_BUFFER) * 1000;

    await this._queueAdapter.addQuizParticipantStartedJob(quizParticipantId, delay);
  }
}
