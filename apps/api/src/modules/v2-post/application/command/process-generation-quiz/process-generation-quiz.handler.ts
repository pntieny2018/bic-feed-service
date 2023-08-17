import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { ProcessGenerationQuizCommand } from './process-generation-quiz.command';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';

@CommandHandler(ProcessGenerationQuizCommand)
export class ProcessGenerationQuizHandler
  implements ICommandHandler<ProcessGenerationQuizCommand, void>
{
  public constructor(
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService
  ) {}
  public async execute(command: ProcessGenerationQuizCommand): Promise<void> {
    const { quizId } = command.payload;
    const quizEntity = await this._quizRepository.findOne(quizId);
    if (!quizEntity) return;
    await this._quizDomainService.generateQuestions(quizEntity);
  }
}
