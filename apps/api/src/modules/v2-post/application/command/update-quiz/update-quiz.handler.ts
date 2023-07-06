import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IQuizRepository,
  QUIZ_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { QuizNotFoundException } from '../../../domain/exception';
import { UpdateQuizCommand } from './update-quiz.command';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { QuizDto } from '../../dto';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { IQuizValidator, QUIZ_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  IQuizDomainService,
  QUIZ_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { IOpenaiService, OPEN_AI_SERVICE_TOKEN } from '@app/openai/openai.service.interface';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface/content.domain-service.interface';

@CommandHandler(UpdateQuizCommand)
export class UpdateQuizHandler implements ICommandHandler<UpdateQuizCommand, QuizDto> {
  @Inject(CONTENT_REPOSITORY_TOKEN)
  private readonly _contentRepository: IContentRepository;
  @Inject(QUIZ_REPOSITORY_TOKEN)
  private readonly _quizRepository: IQuizRepository;
  @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
  private readonly _quizDomainService: IQuizDomainService;
  @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
  private readonly _contentDomainService: IContentDomainService;
  @Inject(QUIZ_VALIDATOR_TOKEN)
  private readonly _quizValidator: IQuizValidator;
  @Inject(USER_APPLICATION_TOKEN)
  private readonly _userAppService: IUserApplicationService;
  @Inject(GROUP_APPLICATION_TOKEN)
  private readonly _groupAppService: IGroupApplicationService;
  @Inject(OPEN_AI_SERVICE_TOKEN)
  private readonly _openaiService: IOpenaiService;
  public async execute(command: UpdateQuizCommand): Promise<QuizDto> {
    const { authUser, quizId, questions } = command.payload;
    const quizEntity = await this._quizRepository.findOne({ id: quizId });
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    const contentEntity = await this._contentDomainService.getVisibleContent(
      quizEntity.get('contentId')
    );

    const groups = await this._groupAppService.findAllByIds(contentEntity.getGroupIds());
    await this._quizValidator.checkCanCUDQuizInGroups(authUser, groups);
    const quizEntityUpdated = await this._quizDomainService.update(quizEntity, {
      ...command.payload,
      questions,
    });

    return new QuizDto({
      id: quizEntityUpdated.get('id'),
      contentId: quizEntityUpdated.get('contentId'),
      status: quizEntityUpdated.get('status'),
      title: quizEntityUpdated.get('title'),
      description: quizEntityUpdated.get('description'),
      numberOfQuestions: quizEntityUpdated.get('numberOfQuestions'),
      numberOfQuestionsDisplay: quizEntityUpdated.get('numberOfQuestionsDisplay'),
      numberOfAnswers: quizEntityUpdated.get('numberOfAnswers'),
      numberOfAnswersDisplay: quizEntityUpdated.get('numberOfAnswersDisplay'),
      isRandom: quizEntityUpdated.get('isRandom'),
      questions: quizEntityUpdated.get('questions'),
      createdAt: quizEntityUpdated.get('createdAt'),
      updatedAt: quizEntityUpdated.get('updatedAt'),
    });
  }
}
