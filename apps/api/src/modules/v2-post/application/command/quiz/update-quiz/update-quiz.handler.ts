import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../../binding/binding-quiz/quiz.interface';
import { QuizDto } from '../../../dto';

import { UpdateQuizCommand } from './update-quiz.command';

@CommandHandler(UpdateQuizCommand)
export class UpdateQuizHandler implements ICommandHandler<UpdateQuizCommand, QuizDto> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding
  ) {}
  public async execute(command: UpdateQuizCommand): Promise<QuizDto> {
    const quizEntityUpdated = await this._quizDomainService.update({
      ...command.payload,
    });
    return this._quizBinding.binding(quizEntityUpdated);
  }
}
