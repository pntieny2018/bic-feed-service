import { ProcessGenerationQuizCommand } from '@api/modules/v2-post/application/command/quiz';
import { QuizGenerateJobDto } from '@api/modules/v2-post/application/dto';
import { Component } from '@libs/infra/v2-queue/decorators';
import { JobPro } from '@libs/infra/v2-queue/shared';
import { CommandBus } from '@nestjs/cqrs';

import { QUIZ_PENDING_PROCESSOR_TOKEN } from '../../../provider';
import { IProcessor } from '../interface';

/**
 * TODO: Move commands to worker folder
 */
@Component({ injectToken: QUIZ_PENDING_PROCESSOR_TOKEN })
export class QuizPendingProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage(job: JobPro<QuizGenerateJobDto>): Promise<void> {
    const { quizId } = job.data;
    this._commandBus.execute<ProcessGenerationQuizCommand, void>(
      new ProcessGenerationQuizCommand({ quizId })
    );
  }
}
