import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../../binding/binding-quiz/quiz.interface';
import { QuestionDto } from '../../../dto';

import { AddQuizQuestionCommand } from './add-quiz-question.command';

@CommandHandler(AddQuizQuestionCommand)
export class AddQuizQuestionHandler
  implements ICommandHandler<AddQuizQuestionCommand, QuestionDto>
{
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding
  ) {}
  public async execute(command: AddQuizQuestionCommand): Promise<QuestionDto> {
    const { quizId, content, answers, authUser } = command.payload;

    const quizQuestionEntity = await this._quizDomainService.addQuestion({
      quizId,
      content,
      answers,
      authUser,
    });

    return this._quizBinding.bindQuizQuestion(quizQuestionEntity);
  }
}
