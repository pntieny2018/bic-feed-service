import { EVENT_SERVICE_TOKEN, IEventService } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';
import { Inject, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { ERRORS } from '../../../../common/constants';
import { DatabaseException } from '../../../../common/exceptions';
import { CursorPaginationResult } from '../../../../common/types';
import { AnswerUserDto } from '../../application/dto';
import { RULES } from '../../constant';
import {
  QuizParticipantFinishedEvent,
  QuizParticipantStartedEvent,
  QuizCreatedEvent,
  QuizGeneratedEvent,
  QuizRegenerateEvent,
} from '../event';
import {
  ContentAccessDeniedException,
  ContentHasQuizException,
  QuizNotFoundException,
  QuizOverTimeException,
  QuizParticipantNotFinishedException,
  QuizQuestionBelongsToQuizException,
  QuizQuestionLimitExceededException,
  QuizQuestionNotFoundException,
} from '../exception';
import { IQuizFactory, QUIZ_FACTORY_TOKEN } from '../factory/interface/quiz.factory.interface';
import { QuizEntity, QuizQuestionEntity } from '../model/quiz';
import { QuizParticipantEntity } from '../model/quiz-participant';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../repositoty-interface';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../repositoty-interface/quiz-participant.repository.interface';
import { IQuizValidator, QUIZ_VALIDATOR_TOKEN } from '../validator/interface';

import {
  AddQuestionProps,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  GetQuizzesProps,
  IContentDomainService,
  IQuizDomainService,
  QuizCreateProps,
  QuizUpdateProps,
  UpdateQuestionProps,
} from './interface';
import {
  IOpenAIAdapter,
  OPEN_AI_ADAPTER,
} from '../service-adapter-interface/openai-adapter.interface';

export class QuizDomainService implements IQuizDomainService {
  private readonly _logger = new Logger(QuizDomainService.name);

  public constructor(
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository,
    @Inject(QUIZ_FACTORY_TOKEN)
    private readonly _quizFactory: IQuizFactory,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(QUIZ_VALIDATOR_TOKEN)
    private readonly _quizValidator: IQuizValidator,
    private readonly event: EventBus,
    @Inject(EVENT_SERVICE_TOKEN)
    private readonly _eventService: IEventService,
    @Inject(OPEN_AI_ADAPTER)
    private readonly _openAiAdapter: IOpenAIAdapter
  ) {}

  public async create(input: QuizCreateProps): Promise<QuizEntity> {
    const {
      authUser,
      contentId,
      title,
      description,
      isRandom,
      numberOfAnswers,
      numberOfQuestions,
      numberOfQuestionsDisplay,
    } = input;

    await this._quizValidator.checkCanCUDQuizInContent(contentId, authUser);

    const quizEntitiesInContent = await this._quizRepository.findAllQuizzes({
      where: {
        contentId,
      },
    });
    if (quizEntitiesInContent.length > 0) {
      throw new ContentHasQuizException();
    }

    const quizEntity = QuizEntity.create(
      {
        title,
        description,
        contentId,
        isRandom,
        numberOfAnswers,
        numberOfQuestions,
        numberOfQuestionsDisplay,
      },
      authUser.id
    );
    try {
      await this._quizRepository.createQuiz(quizEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    this.event.publish(new QuizCreatedEvent(quizEntity.get('id')));
    return quizEntity;
  }

  public async update(input: QuizUpdateProps): Promise<QuizEntity> {
    const { authUser, quizId, ...quizUpdateProps } = input;

    const quizEntity = await this._quizRepository.findQuizByIdWithQuestions(quizId);
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }

    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    quizEntity.updateAttribute(quizUpdateProps);
    try {
      await this._quizRepository.updateQuiz(quizEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return quizEntity;
  }

  public async updateQuestion(
    updateQuestionProps: UpdateQuestionProps
  ): Promise<QuizQuestionEntity> {
    const { authUser, questionId, content, answers } = updateQuestionProps;
    const quizQuestionEntity = await this._quizRepository.findQuestionById(questionId);
    if (!quizQuestionEntity) {
      throw new QuizQuestionNotFoundException();
    }

    const quizEntity = await this._quizRepository.findQuizById(quizQuestionEntity.get('quizId'));

    if (!quizEntity) {
      throw new QuizNotFoundException();
    }

    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    quizQuestionEntity.updateAttribute({
      content,
      answers,
    });
    quizQuestionEntity.validateAnswers();
    if (quizQuestionEntity.isChanged()) {
      try {
        await this._quizRepository.updateQuestion(quizQuestionEntity);
      } catch (e) {
        this._logger.error(JSON.stringify(e?.stack));
        throw new DatabaseException();
      }
    }

    return quizQuestionEntity;
  }

  public async addQuestion(addQuestionProps: AddQuestionProps): Promise<QuizQuestionEntity> {
    const { authUser, quizId } = addQuestionProps;
    const quizEntity = await this._quizRepository.findQuizByIdWithQuestions(quizId);
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);
    if (quizEntity.get('questions')?.length >= RULES.QUIZ_MAX_QUESTION) {
      throw new QuizQuestionLimitExceededException();
    }
    const quizQuestionEntity = this._quizFactory.createQuizQuestion(addQuestionProps);

    quizQuestionEntity.validateAnswers();
    try {
      await this._quizRepository.addQuestion(quizQuestionEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }

    return quizQuestionEntity;
  }

  public async deleteQuestion(
    questionId: string,
    quizId: string,
    authUser: UserDto
  ): Promise<void> {
    const quizQuestionEntity = await this._quizRepository.findQuestionById(questionId);
    if (!quizQuestionEntity) {
      throw new QuizQuestionNotFoundException();
    }

    if (quizQuestionEntity.get('quizId') !== quizId) {
      throw new QuizQuestionBelongsToQuizException();
    }

    const quizEntity = await this._quizRepository.findQuizByIdWithQuestions(
      quizQuestionEntity.get('quizId')
    );
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }

    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    quizEntity.deleteQuestion(questionId);

    try {
      await this._quizRepository.deleteQuestion(questionId);
      await this._quizRepository.updateQuiz(quizEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException(e.message);
    }
  }

  public async getQuiz(quizId: string, authUser: UserDto): Promise<QuizEntity> {
    const quizEntity = await this._quizRepository.findQuizByIdWithQuestions(quizId);
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    return quizEntity;
  }

  public async delete(quizId: string, authUser: UserDto): Promise<void> {
    const quizEntity = await this._quizRepository.findQuizById(quizId);
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    try {
      await this._quizRepository.deleteQuiz(quizId);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async startQuiz(
    quizEntity: QuizEntity,
    authUser: UserDto
  ): Promise<QuizParticipantEntity> {
    const quizParticipantEntity = QuizParticipantEntity.createFromQuiz(quizEntity, authUser.id);

    if (quizEntity.isRandomQuestion()) {
      quizParticipantEntity.shuffleQuestions();
    }
    quizParticipantEntity.filterQuestionDisplay(quizEntity.get('numberOfQuestionsDisplay'));

    try {
      await this._quizParticipantRepository.create(quizParticipantEntity);
      this._eventService.publish(
        new QuizParticipantStartedEvent({
          quizParticipantId: quizParticipantEntity.get('id'),
          startedAt: quizParticipantEntity.get('startedAt'),
          timeLimit: quizParticipantEntity.get('timeLimit'),
        })
      );
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException(e.message);
    }

    return quizParticipantEntity;
  }

  public async updateQuizAnswers(
    quizParticipantEntity: QuizParticipantEntity,
    answers: AnswerUserDto[],
    isFinished: boolean
  ): Promise<void> {
    if (quizParticipantEntity.isFinishedOrOverTimeLimit()) {
      throw new QuizOverTimeException();
    }

    quizParticipantEntity.updateAnswers(answers);
    if (isFinished) {
      quizParticipantEntity.setFinishedAt();
    }

    try {
      await this._quizParticipantRepository.update(quizParticipantEntity);

      if (isFinished) {
        this.event.publish(
          new QuizParticipantFinishedEvent({
            quizParticipantId: quizParticipantEntity.get('id'),
          })
        );
      }
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async getQuizzes(input: GetQuizzesProps): Promise<CursorPaginationResult<QuizEntity>> {
    const { authUser, type, status } = input;
    return this._quizRepository.getPagination({
      ...input,
      where: {
        createdBy: authUser.id,
        status,
        contentType: type,
      },
      attributes: ['id', 'postId', 'createdAt'],
    });
  }

  public async reGenerate(quizId: string, authUser: UserDto): Promise<QuizEntity> {
    const quizEntity = await this._quizRepository.findQuizByIdWithQuestions(quizId);
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    quizEntity.setPending();
    try {
      await this._quizRepository.updateQuiz(quizEntity);
      this.event.publish(new QuizRegenerateEvent(quizEntity.get('id')));
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }

    return quizEntity;
  }

  public async generateQuestions(quizId: string): Promise<void> {
    const quizEntity = await this._quizRepository.findQuizById(quizId);
    if (!quizEntity) {
      return;
    }

    if (quizEntity.isProcessing()) {
      return;
    }

    const contentEntity = await this._contentDomainService.getVisibleContent(
      quizEntity.get('contentId')
    );
    const rawContent = this._contentDomainService.getRawContent(contentEntity);
    if (!rawContent) {
      quizEntity.setFail({
        code: ERRORS.CONTENT_NOT_FOUND,
        message: 'Content not found',
      });
      await this._quizRepository.updateQuiz(quizEntity);
      this.event.publish(new QuizGeneratedEvent(quizEntity.get('id')));
      return;
    }

    try {
      quizEntity.setProcessing();
      await this._quizRepository.updateQuiz(quizEntity);
      quizEntity.setProcessing();
      await this._quizRepository.updateQuiz(quizEntity);

      const { questions, usage, model, maxTokens, completion } =
        await this._openAiAdapter.generateQuestions({
          content: rawContent,
          numberOfQuestions: quizEntity.get('numberOfQuestions'),
          numberOfAnswers: quizEntity.get('numberOfAnswers'),
        });

      if (questions.length === 0) {
        quizEntity.setFail({
          code: ERRORS.QUIZ_GENERATE_FAIL,
          message: 'No questions generated',
        });
        await this._quizRepository.updateQuiz(quizEntity);
        await this._quizRepository.updateQuiz(quizEntity);
        this.event.publish(new QuizGeneratedEvent(quizEntity.get('id')));
        return;
      }

      quizEntity.updateAttribute({
        questions: questions.map(
          (question) =>
            new QuizQuestionEntity({
              ...question,
              quizId: quizEntity.get('id'),
            })
        ),
        meta: {
          usage,
          model,
          maxTokens,
          completion,
        },
      });

      quizEntity.setProcessed();
      await this._quizRepository.updateQuiz(quizEntity);
    } catch (e) {
      quizEntity.setFail({
        code: ERRORS.QUIZ_GENERATE_FAIL,
        message: e.response.data?.error?.message || '',
      });
    }
    await this._quizRepository.updateQuiz(quizEntity);
    this.event.publish(new QuizGeneratedEvent(quizEntity.get('id')));
  }

  public async getQuizParticipant(
    quizParticipantId: string,
    authUserId: string
  ): Promise<QuizParticipantEntity> {
    const quizParticipantEntity = await this._quizParticipantRepository.getQuizParticipantById(
      quizParticipantId
    );

    if (!quizParticipantEntity.isOwner(authUserId)) {
      throw new ContentAccessDeniedException();
    }

    if (!quizParticipantEntity.isFinishedOrOverTimeLimit()) {
      quizParticipantEntity.hideResult();
    }

    return quizParticipantEntity;
  }

  public async calculateHighestScore(quizParticipantEntity: QuizParticipantEntity): Promise<void> {
    if (!quizParticipantEntity.isFinishedOrOverTimeLimit()) {
      throw new QuizParticipantNotFinishedException();
    }

    const contentId = quizParticipantEntity.get('contentId');
    const userId = quizParticipantEntity.get('createdBy');

    const currentHighestScoreQuizParticipantEntity =
      await this._quizParticipantRepository.findQuizParticipantHighestScoreByContentIdAndUserId(
        contentId,
        userId
      );

    const currentHighestScoreQuizParticipantId =
      currentHighestScoreQuizParticipantEntity?.get('id') || '';
    const currentHighestScore = currentHighestScoreQuizParticipantEntity?.get('score') || 0;

    const quizParticipantId = quizParticipantEntity.get('id');
    const newScore = quizParticipantEntity.get('score');

    if (
      quizParticipantId !== currentHighestScoreQuizParticipantId &&
      newScore >= currentHighestScore
    ) {
      quizParticipantEntity.setHighest(true);
      await this._quizParticipantRepository.updateIsHighest(quizParticipantEntity.get('id'), true);
      this._logger.debug(
        `New highest score: ${quizParticipantId} - ${newScore} for contentId: ${contentId} and userId: ${userId}`
      );

      if (currentHighestScoreQuizParticipantEntity) {
        currentHighestScoreQuizParticipantEntity.setHighest(false);
        await this._quizParticipantRepository.updateIsHighest(
          currentHighestScoreQuizParticipantEntity.get('id'),
          false
        );
        this._logger.debug(
          `Remove highest score: ${currentHighestScoreQuizParticipantId} - ${currentHighestScore} for contentId: ${contentId} and userId: ${userId}`
        );
      }
    }
  }
}
