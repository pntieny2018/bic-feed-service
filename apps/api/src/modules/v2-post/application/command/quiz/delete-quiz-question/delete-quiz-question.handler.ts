import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';

import { DeleteQuizQuestionCommand } from './delete-quiz-question.command';

@CommandHandler(DeleteQuizQuestionCommand)
export class DeleteQuizQuestionHandler implements ICommandHandler<DeleteQuizQuestionCommand, void> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService
  ) {}
  public async execute(command: DeleteQuizQuestionCommand): Promise<void> {
    const { quizId, questionId, authUser } = command.payload;

    await this._quizDomainService.deleteQuestion(questionId, quizId, authUser);
  }
}
