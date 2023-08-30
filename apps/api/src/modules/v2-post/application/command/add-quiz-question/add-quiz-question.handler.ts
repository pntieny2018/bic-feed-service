import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { AddQuizQuestionCommand } from './add-quiz-question.command';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../binding/binding-quiz/quiz.interface';
import { QuizQuestionDto } from '../../dto/quiz-question.dto';

@CommandHandler(AddQuizQuestionCommand)
export class AddQuizQuestionHandler
  implements ICommandHandler<AddQuizQuestionCommand, QuizQuestionDto>
{
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding
  ) {}
  public async execute(command: AddQuizQuestionCommand): Promise<QuizQuestionDto> {
    const { quizId, authUser, answers, content } = command.payload;

    const quizQuestionEntity = await this._quizDomainService.addQuestion({
      quizId,
      authUser,
      answers,
      content,
    });

    return this._quizBinding.bindQuizQuestion(quizQuestionEntity);
  }
}
