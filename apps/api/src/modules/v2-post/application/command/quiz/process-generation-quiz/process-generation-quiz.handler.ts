import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';

import { ProcessGenerationQuizCommand } from './process-generation-quiz.command';

@CommandHandler(ProcessGenerationQuizCommand)
export class ProcessGenerationQuizHandler
  implements ICommandHandler<ProcessGenerationQuizCommand, void>
{
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService
  ) {}
  public async execute(command: ProcessGenerationQuizCommand): Promise<void> {
    const { quizId } = command.payload;
    await this._quizDomainService.generateQuestions(quizId);
  }
}
