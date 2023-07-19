import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { QuizNotFoundException } from '../../../domain/exception';
import { GenerateQuizCommand } from './generate-quiz.command';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { IQuizValidator, QUIZ_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface/content.domain-service.interface';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { QUIZ_BINDING_TOKEN } from '../../binding/binding-quiz/quiz.interface';
import { QuizBinding } from '../../binding/binding-quiz/quiz.binding';
import { QuizDto } from '../../dto';

@CommandHandler(GenerateQuizCommand)
export class GenerateQuizHandler implements ICommandHandler<GenerateQuizCommand, QuizDto> {
  public constructor(
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(QUIZ_VALIDATOR_TOKEN)
    private readonly _quizValidator: IQuizValidator,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: QuizBinding
  ) {}

  public async execute(command: GenerateQuizCommand): Promise<QuizDto> {
    const { authUser, quizId } = command.payload;
    const quizEntityUpdated = await this._quizDomainService.reGenerate(quizId, authUser);

    return this._quizBinding.binding(quizEntityUpdated);
  }
}
