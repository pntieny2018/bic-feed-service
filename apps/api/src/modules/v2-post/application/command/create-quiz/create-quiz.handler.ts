import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { OpenAIException } from '../../../domain/exception';
import { CreateQuizCommand } from './create-quiz.command';
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
import { ContentEmptyException } from '../../../domain/exception/content-empty.exception';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface/content.domain-service.interface';

@CommandHandler(CreateQuizCommand)
export class CreateQuizHandler implements ICommandHandler<CreateQuizCommand, QuizDto> {
  @Inject(CONTENT_REPOSITORY_TOKEN)
  private readonly _contentRepository: IContentRepository;
  @Inject(QUIZ_DOMAIN_SERVICE_TOKEN)
  private readonly _quizDomainService: IQuizDomainService;
  @Inject(QUIZ_VALIDATOR_TOKEN)
  private readonly _quizValidator: IQuizValidator;
  @Inject(USER_APPLICATION_TOKEN)
  private readonly _userAppService: IUserApplicationService;
  @Inject(GROUP_APPLICATION_TOKEN)
  private readonly _groupAppService: IGroupApplicationService;
  @Inject(OPEN_AI_SERVICE_TOKEN)
  private readonly _openaiService: IOpenaiService;
  @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
  private readonly _contentDomainService: IContentDomainService;
  public async execute(command: CreateQuizCommand): Promise<QuizDto> {
    const { authUser, contentId } = command.payload;

    const contentEntity = await this._contentDomainService.getContent(contentId);
    const groups = await this._groupAppService.findAllByIds(contentEntity.getGroupIds());
    await this._quizValidator.checkCanCUDQuizInGroups(authUser, groups);

    //questions
    const rawContent = this._contentDomainService.getRawContent(contentEntity);
    if (!rawContent) {
      throw new ContentEmptyException();
    }

    const quizEntity = await this._quizDomainService.create({
      ...command.payload,
    });

    let response = null;
    try {
      response = await this._openaiService.generateQuestion({
        content: rawContent,
        numberOfQuestions: command.payload.numberOfQuestions,
        numberOfAnswers: command.payload.numberOfAnswers,
      });
    } catch (e) {
      throw new OpenAIException(e.message);
    }

    if (response.questions?.length === 0) {
      await this._quizDomainService.update(quizEntity, {
        authUser,
        meta: {
          usage: response.usage,
          model: response.model,
          maxTokens: response.maxTokens,
          completion: response.completion,
        },
      });
      throw new OpenAIException('No questions generated');
    }
    const quizEntityUpdated = await this._quizDomainService.update(quizEntity, {
      authUser,
      questions: response.questions,
      meta: {
        usage: response.usage,
        model: response.model,
        maxTokens: response.maxTokens,
        completion: response.completion,
      },
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
