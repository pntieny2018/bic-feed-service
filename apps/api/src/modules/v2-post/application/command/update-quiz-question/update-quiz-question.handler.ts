import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../binding/binding-quiz/quiz.interface';
import { QuestionDto } from '../../dto';

import { UpdateQuizQuestionCommand } from './update-quiz-question.command';

@CommandHandler(UpdateQuizQuestionCommand)
export class UpdateQuizQuestionHandler
  implements ICommandHandler<UpdateQuizQuestionCommand, QuestionDto>
{
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding
  ) {}
  public async execute(command: UpdateQuizQuestionCommand): Promise<QuestionDto> {
    const { authUser, answers, questionId, content } = command.payload;

    const quizQuestionEntity = await this._quizDomainService.updateQuestion({
      authUser,
      answers,
      questionId,
      content,
    });

    return this._quizBinding.bindQuizQuestion(quizQuestionEntity);
  }
}
