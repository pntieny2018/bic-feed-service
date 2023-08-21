import { IOpenaiService, OPEN_AI_SERVICE_TOKEN } from '@app/openai/openai.service.interface';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../../v2-group/application';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../../v2-user/application';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface/content.domain-service.interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IQuizRepository,
  QUIZ_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { IQuizValidator, QUIZ_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../../../binding/binding-quiz/quiz.interface';
import { QuizDto } from '../../../dto';

import { UpdateQuizCommand } from './update-quiz.command';

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
