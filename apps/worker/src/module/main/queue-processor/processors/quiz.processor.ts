import { ProcessGenerationQuizCommand } from '@api/modules/v2-post/application/command/quiz';
import { QuizGenerateJobDto } from '@api/modules/v2-post/application/dto';
import { Process } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Job } from 'bullmq';

import { CONTENT_SCHEDULED_PROCESSOR_TOKEN } from '../data-type';

@Injectable()
export class QuizProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  @Process(CONTENT_SCHEDULED_PROCESSOR_TOKEN)
  public async handleQuizGenerate(job: Job<QuizGenerateJobDto>): Promise<void> {
    const { quizId } = job.data;
    await this._commandBus.execute<ProcessGenerationQuizCommand, void>(
      new ProcessGenerationQuizCommand({ quizId })
    );
  }
}
