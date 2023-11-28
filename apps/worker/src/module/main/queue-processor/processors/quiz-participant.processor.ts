import { ProcessQuizParticipantResultCommand } from '@api/modules/v2-post/application/command/quiz';
import { QuizParticipantResultJobDto } from '@api/modules/v2-post/application/dto';
import { QUEUES } from '@libs/common/constants';
import { ProcessorAndLog } from '@libs/infra/log';
import { JobWithContext } from '@libs/infra/queue';
import { Process } from '@nestjs/bull';
import { CommandBus } from '@nestjs/cqrs';

@ProcessorAndLog(QUEUES.QUIZ_PARTICIPANT_RESULT.QUEUE_NAME)
export class QuizParticipantProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  @Process(QUEUES.QUIZ_PARTICIPANT_RESULT.JOBS.PROCESS_QUIZ_PARTICIPANT_RESULT)
  public async handleQuizParticipantResult(
    job: JobWithContext<QuizParticipantResultJobDto>
  ): Promise<void> {
    const { quizParticipantId } = job.data.data;
    await this._commandBus.execute<ProcessQuizParticipantResultCommand, void>(
      new ProcessQuizParticipantResultCommand({ quizParticipantId })
    );
  }
}
