import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../../binding/binding-quiz/quiz.interface';
import { QuizDto } from '../../../dto';

import { CreateQuizCommand } from './create-quiz.command';

@CommandHandler(CreateQuizCommand)
export class CreateQuizHandler implements ICommandHandler<CreateQuizCommand, QuizDto> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding
  ) {}
  public async execute(command: CreateQuizCommand): Promise<QuizDto> {
    const quizEntity = await this._quizDomainService.create({
      ...command.payload,
    });

    return this._quizBinding.binding(quizEntity);
  }
}
