import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { StartQuizCommand } from './start-quiz.command';

@CommandHandler(StartQuizCommand)
export class StartQuizHandler implements ICommandHandler<StartQuizCommand, void> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService
  ) {}
  public async execute(command: StartQuizCommand): Promise<void> {
    const { authUser, quizId } = command.payload;

    await this._quizDomainService.delete(quizId, authUser);
  }
}
