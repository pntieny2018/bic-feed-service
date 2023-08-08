import { CommandBus } from '@nestjs/cqrs';
import { Process, Processor } from '@nestjs/bull';
import { QUEUES } from '@app/queue/queue.constant';

import { Job } from '@app/queue/interfaces';
import { QuizParticipantResultJobDto } from '../../application/dto/queue.dto';
import { ProcessQuizParticipantResultCommand } from '../../application/command/process-quiz-participant-result/process-quiz-participant-result.command';

@Processor(QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME)
export class QuizParticipantProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  @Process(QUEUES.QUIZ_PARTICIPANT_RESULT.JOBS.PROCESS_QUIZ_PARTICIPANT_RESULT)
  public async handleQuizParticipantResult(job: Job<QuizParticipantResultJobDto>): Promise<void> {
    const { quizParticipantId } = job.data;
    await this._commandBus.execute<ProcessQuizParticipantResultCommand, void>(
      new ProcessQuizParticipantResultCommand({ quizParticipantId })
    );
  }
}
