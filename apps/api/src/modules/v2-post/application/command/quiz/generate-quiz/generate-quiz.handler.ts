import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { QuizBinding, QUIZ_BINDING_TOKEN } from '../../../binding';
import { QuizDto } from '../../../dto';

import { GenerateQuizCommand } from './generate-quiz.command';

@CommandHandler(GenerateQuizCommand)
export class GenerateQuizHandler implements ICommandHandler<GenerateQuizCommand, QuizDto> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: QuizBinding
  ) {}

  public async execute(command: GenerateQuizCommand): Promise<QuizDto> {
    const { authUser, quizId } = command.payload;
    const quizEntityUpdated = await this._quizDomainService.reGenerate(quizId, authUser);

    return this._quizBinding.binding(quizEntityUpdated);
  }
}
