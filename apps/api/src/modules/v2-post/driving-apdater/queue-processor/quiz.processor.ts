import { QUEUES } from '@libs/common/constants';
import { ProcessorAndLog } from '@libs/infra/log';
import { JobWithContext } from '@libs/infra/queue';
import { Process } from '@nestjs/bull';
import { CommandBus } from '@nestjs/cqrs';

import { ProcessGenerationQuizCommand } from '../../application/command/quiz';
import { QuizGenerateJobDto } from '../../application/dto';

@ProcessorAndLog(QUEUES.QUIZ_PENDING.QUEUE_NAME)
export class QuizProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  @Process(QUEUES.QUIZ_PENDING.JOBS.PROCESS_QUIZ_PENDING)
  public async handleQuizGenerate(job: JobWithContext<QuizGenerateJobDto>): Promise<void> {
    const { quizId } = job.data.data;
    await this._commandBus.execute<ProcessGenerationQuizCommand, void>(
      new ProcessGenerationQuizCommand({ quizId })
    );
  }
}
