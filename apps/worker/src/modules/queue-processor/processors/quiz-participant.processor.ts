import { ProcessQuizParticipantResultCommand } from '@api/modules/v2-post/application/command/quiz';
import { QuizParticipantResultJobDto } from '@api/modules/v2-post/application/dto';
import { Component } from '@libs/infra/v2-queue/decorators';
import { JobPro } from '@libs/infra/v2-queue/shared';
import { CommandBus } from '@nestjs/cqrs';

import { IProcessor } from '../interface';
import { QUIZ_PARTICIPANT_PROCESSOR_TOKEN } from '../provider';

/**
 * TODO: Move commands to worker folder
 */
@Component({ injectToken: QUIZ_PARTICIPANT_PROCESSOR_TOKEN })
export class QuizParticipantProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage(job: JobPro<QuizParticipantResultJobDto>): Promise<void> {
    const { quizParticipantId } = job.data;
    await this._commandBus.execute<ProcessQuizParticipantResultCommand, void>(
      new ProcessQuizParticipantResultCommand({ quizParticipantId })
    );
  }
}
