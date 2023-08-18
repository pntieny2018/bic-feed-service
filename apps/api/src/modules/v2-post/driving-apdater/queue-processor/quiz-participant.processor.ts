import { Job } from '@app/queue/interfaces';
import { QUEUES } from '@app/queue/queue.constant';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { ProcessQuizParticipantResultCommand } from '../../application/command/quiz';
import { QuizParticipantResultJobDto } from '../../application/dto/queue.dto';

@Processor(QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME)
export class QuizParticipantProcessor {
  private readonly _logger = new Logger(QuizParticipantProcessor.name);

  public constructor(private readonly _commandBus: CommandBus) {}

  @Process(QUEUES.QUIZ_PARTICIPANT_RESULT.JOBS.PROCESS_QUIZ_PARTICIPANT_RESULT)
  public async handleQuizParticipantResult(job: Job<QuizParticipantResultJobDto>): Promise<void> {
    this._logger.debug(`JobProcessor: ${JSON.stringify(job)}`);
    const { quizParticipantId } = job.data;
    await this._commandBus.execute<ProcessQuizParticipantResultCommand, void>(
      new ProcessQuizParticipantResultCommand({ quizParticipantId })
    );
  }
}
