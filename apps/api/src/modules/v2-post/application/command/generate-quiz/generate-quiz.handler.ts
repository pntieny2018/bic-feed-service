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

@CommandHandler(GenerateQuizCommand)
export class GenerateQuizHandler implements ICommandHandler<GenerateQuizCommand, void> {
  public constructor(
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(QUIZ_VALIDATOR_TOKEN)
    private readonly _quizValidator: IQuizValidator,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService
  ) {}

  public async execute(command: GenerateQuizCommand): Promise<void> {
    const { authUser, quizId } = command.payload;
    const quizEntity = await this._quizRepository.findOne({ where: { id: quizId } });
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    const contentEntity = await this._contentDomainService.getVisibleContent(
      quizEntity.get('contentId')
    );

    const groups = await this._groupAppService.findAllByIds(contentEntity.getGroupIds());
    await this._quizValidator.checkCanCUDQuizInGroups(authUser, groups);
  }
}
