import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { DeleteQuizQuestionCommand } from './delete-quiz-question.command';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';

@CommandHandler(DeleteQuizQuestionCommand)
export class DeleteQuizQuestionHandler implements ICommandHandler<DeleteQuizQuestionCommand, void> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository
  ) {}
  public async execute(command: DeleteQuizQuestionCommand): Promise<void> {
    const { authUser, questionId } = command.payload;

    await this._quizDomainService.deleteQuestion(questionId, authUser);
  }
}
