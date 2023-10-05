import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';

import { DeleteQuizCommand } from './delete-quiz.command';

@CommandHandler(DeleteQuizCommand)
export class DeleteQuizHandler implements ICommandHandler<DeleteQuizCommand, void> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService
  ) {}
  public async execute(command: DeleteQuizCommand): Promise<void> {
    const { authUser, quizId } = command.payload;

    await this._quizDomainService.delete(quizId, authUser);
  }
}
