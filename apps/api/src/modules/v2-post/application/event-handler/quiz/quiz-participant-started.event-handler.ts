import { QUEUES } from '@libs/common/constants';
import { IQueueService, QUEUE_SERVICE_TOKEN } from '@libs/infra/queue';
import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { RULES } from '../../../constant';
import { QuizParticipantStartedEvent } from '../../../domain/event';
import { QuizParticipantResultJobDto } from '../../dto/queue.dto';

@EventsHandler(QuizParticipantStartedEvent)
export class QuizParticipantStartedEventHandler
  implements IEventHandler<QuizParticipantStartedEvent>
{
  private readonly _logger = new Logger(QuizParticipantStartedEventHandler.name);
  public constructor(
    @Inject(QUEUE_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {}

  public async handle(event: QuizParticipantStartedEvent): Promise<void> {
    this._logger.debug(`EventHandler: ${JSON.stringify(event)}`);

    const { quizParticipantId, timeLimit } = event.payload;
    const delay = (timeLimit + RULES.QUIZ_TIME_LIMIT_BUFFER) * 1000;

    await this._queueService.addBulkJobs<QuizParticipantResultJobDto>([
      {
        name: QUEUES.QUIZ_PARTICIPANT_RESULT.JOBS.PROCESS_QUIZ_PARTICIPANT_RESULT,
        data: { quizParticipantId },
        opts: { delay, jobId: quizParticipantId },
        queue: { name: QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME },
      },
    ]);
  }
}
