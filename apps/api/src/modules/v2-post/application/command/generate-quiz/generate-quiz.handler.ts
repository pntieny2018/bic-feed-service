import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IQuizRepository,
  QUIZ_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { OpenAIException, QuizNotFoundException } from '../../../domain/exception';
import { GenerateQuizCommand } from './generate-quiz.command';
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
import { ContentEmptyException } from '../../../domain/exception/content-empty.exception';

@CommandHandler(GenerateQuizCommand)
export class GenerateQuizHandler implements ICommandHandler<GenerateQuizCommand, QuizDto> {
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
  public async execute(command: GenerateQuizCommand): Promise<QuizDto> {
    const { authUser, quizId, numberOfQuestions, numberOfAnswers } = command.payload;
    const quizEntity = await this._quizRepository.findOne({ id: quizId });
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    const contentEntity = await this._contentDomainService.getContent(quizEntity.get('contentId'));

    const groups = await this._groupAppService.findAllByIds(contentEntity.getGroupIds());
    await this._quizValidator.checkCanCUDQuizInGroups(authUser, groups);

    const rawContent = this._contentDomainService.getRawContent(contentEntity);
    if (!rawContent) {
      throw new ContentEmptyException();
    }

    let response = null;
    try {
      response = await this._openaiService.generateQuestion({
        content: rawContent,
        numberOfQuestions: numberOfQuestions || quizEntity.get('numberOfQuestions'),
        numberOfAnswers: numberOfAnswers || quizEntity.get('numberOfQuestions'),
      });
    } catch (e) {
      throw new OpenAIException(e.message);
    }
    const quizEntityUpdated = await this._quizDomainService.update(quizEntity, {
      ...command.payload,
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
