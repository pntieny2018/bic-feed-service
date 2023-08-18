import { QueueService } from '@app/queue';
import { QUEUES } from '@app/queue/queue.constant';
import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { RULES } from '../../../constant';
import { QuizParticipantStartedEvent } from '../../../domain/event';
import { QuizParticipantResultJobDto } from '../../dto/queue.dto';

@EventsHandler(QuizParticipantStartedEvent)
export class QuizParticipantStartedEventHandler
  implements IEventHandler<QuizParticipantStartedEvent>
{
  private readonly _logger = new Logger(QuizParticipantStartedEventHandler.name);
  public constructor(private readonly _queueService: QueueService) {}

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
