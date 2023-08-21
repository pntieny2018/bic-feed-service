import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IQuizRepository,
  QUIZ_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { UpdateQuizCommand } from './update-quiz.command';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { QuizDto } from '../../dto';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { IQuizValidator, QUIZ_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  QUIZ_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  IQuizDomainService,
} from '../../../domain/domain-service/interface';
import { IOpenaiService, OPEN_AI_SERVICE_TOKEN } from '@app/openai/openai.service.interface';

import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../binding/binding-quiz/quiz.interface';

@CommandHandler(UpdateQuizCommand)
export class UpdateQuizHandler implements ICommandHandler<UpdateQuizCommand, QuizDto> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
    private readonly _quizDomainService: IQuizDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(QUIZ_VALIDATOR_TOKEN)
    private readonly _quizValidator: IQuizValidator,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userAppService: IUserApplicationService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(OPEN_AI_SERVICE_TOKEN)
    private readonly _openaiService: IOpenaiService,
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
