import { QUEUES } from '@app/queue/queue.constant';
import { Process, Processor } from '@nestjs/bull';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Job } from 'bull';

import { ProcessGenerationQuizCommand } from '../../application/command/quiz/process-generation-quiz';

@Processor(QUEUES.QUIZ_PENDING.QUEUE_NAME)
export class QuizProcessor {
  public constructor(
    private readonly _commandBus: CommandBus,
    private readonly _queryBus: QueryBus
  ) {}

  @Process(QUEUES.QUIZ_PENDING.JOBS.PROCESS_QUIZ_PENDING)
  public async postChanged(job: Job): Promise<void> {
    const { quizId } = job.data;
    await this._commandBus.execute<ProcessGenerationQuizCommand, void>(
      new ProcessGenerationQuizCommand({ quizId })
    );
  }
}
