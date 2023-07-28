import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GenerateQuizCommand } from './generate-quiz.command';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { QUIZ_BINDING_TOKEN } from '../../binding/binding-quiz/quiz.interface';
import { QuizBinding } from '../../binding/binding-quiz/quiz.binding';
import { QuizDto } from '../../dto';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';

@CommandHandler(GenerateQuizCommand)
export class GenerateQuizHandler implements ICommandHandler<GenerateQuizCommand, QuizDto> {
  public constructor(
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: QuizBinding,
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository
  ) {}

  public async execute(command: GenerateQuizCommand): Promise<QuizDto> {
    const { authUser, quizId } = command.payload;
    const quizEntity = await this._quizRepository.findOne({
      where: {
        id: quizId,
      },
    });
    const quizEntityUpdated = await this._quizDomainService.generateQuestions(quizEntity);

    return this._quizBinding.binding(quizEntity);
  }
}
