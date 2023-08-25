import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { RULES } from '../../../constant';
import { QuizParticipantStartedEvent } from '../../../domain/event';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../../domain/infra-adapter-interface';

@EventsHandler(QuizParticipantStartedEvent)
export class QuizParticipantStartedEventHandler
  implements IEventHandler<QuizParticipantStartedEvent>
{
  private readonly _logger = new Logger(QuizParticipantStartedEventHandler.name);
  public constructor(
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter
  ) {}

  public async handle(event: QuizParticipantStartedEvent): Promise<void> {
    this._logger.debug(`EventHandler: ${JSON.stringify(event)}`);

    const { quizParticipantId, timeLimit } = event.payload;
    const delay = (timeLimit + RULES.QUIZ_TIME_LIMIT_BUFFER) * 1000;

    await this._queueAdapter.addQuizParticipantStartedJob(quizParticipantId, delay);
  }
}
