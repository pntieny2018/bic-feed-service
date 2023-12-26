import { CursorPaginationResult } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';
import { Inject, Logger } from '@nestjs/common';

import { ERRORS } from '../../../../common/constants';
import { DatabaseException } from '../../../../common/exceptions';
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
import { EVENT_ADAPTER, IEventAdapter } from '../infra-adapter-interface';
import { QuizEntity, QuizQuestionEntity } from '../model/quiz';
import { QuizParticipantEntity } from '../model/quiz-participant';
import {
  IQuizRepository,
  QUIZ_REPOSITORY_TOKEN,
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { IOpenAIAdapter, OPEN_AI_ADAPTER } from '../service-adapter-interface';
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

export class QuizDomainService implements IQuizDomainService {
  private readonly _logger = new Logger(QuizDomainService.name);

  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService,

    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepo: IQuizRepository,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepo: IQuizParticipantRepository,

    @Inject(QUIZ_VALIDATOR_TOKEN)
    private readonly _quizValidator: IQuizValidator,

    @Inject(EVENT_ADAPTER)
    private readonly _eventAdapter: IEventAdapter,
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

    const quizEntitiesInContent = await this._quizRepo.findAllQuizzes({
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
      await this._quizRepo.createQuiz(quizEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    this._eventAdapter.publish(new QuizCreatedEvent({ quizId: quizEntity.get('id') }));
    return quizEntity;
  }

  public async update(input: QuizUpdateProps): Promise<QuizEntity> {
    const { authUser, quizId, ...quizUpdateProps } = input;

    const quizEntity = await this._quizRepo.findQuizByIdWithQuestions(quizId);
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }

    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    quizEntity.updateAttribute(quizUpdateProps);
    try {
      await this._quizRepo.updateQuiz(quizEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return quizEntity;
  }

  public async updateQuestion(
    updateQuestionProps: UpdateQuestionProps
  ): Promise<QuizQuestionEntity> {
    const { quizId, questionId, content, answers, authUser } = updateQuestionProps;
    const quizQuestionEntity = await this._quizRepo.findQuestionById(questionId);
    if (!quizQuestionEntity) {
      throw new QuizQuestionNotFoundException();
    }

    if (quizQuestionEntity.get('quizId') !== quizId) {
      throw new QuizQuestionBelongsToQuizException();
    }

    const quizEntity = await this._quizRepo.findQuizByIdWithQuestions(
      quizQuestionEntity.get('quizId')
    );
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
        await this._quizRepo.updateQuestion(quizQuestionEntity);
        await this._quizRepo.deleteAnswersByQuestionId(quizQuestionEntity.get('id'));
        await this._quizRepo.createAnswers(quizQuestionEntity);
      } catch (e) {
        this._logger.error(JSON.stringify(e?.stack));
        throw new DatabaseException(e.message);
      }
    }

    return quizQuestionEntity;
  }

  public async addQuestion(addQuestionProps: AddQuestionProps): Promise<QuizQuestionEntity> {
    const { quizId, authUser } = addQuestionProps;

    const quizEntity = await this._quizRepo.findQuizByIdWithQuestions(quizId);
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }

    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    if (quizEntity.get('questions')?.length >= RULES.QUIZ_MAX_QUESTION) {
      throw new QuizQuestionLimitExceededException();
    }

    const quizQuestionEntity = QuizQuestionEntity.create(addQuestionProps);

    try {
      await this._quizRepo.createQuestion(quizQuestionEntity);
      await this._quizRepo.createAnswers(quizQuestionEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException(e.message);
    }

    return quizQuestionEntity;
  }

  public async deleteQuestion(
    questionId: string,
    quizId: string,
    authUser: UserDto
  ): Promise<void> {
    const quizQuestionEntity = await this._quizRepo.findQuestionById(questionId);
    if (!quizQuestionEntity) {
      throw new QuizQuestionNotFoundException();
    }

    if (quizQuestionEntity.get('quizId') !== quizId) {
      throw new QuizQuestionBelongsToQuizException();
    }

    const quizEntity = await this._quizRepo.findQuizByIdWithQuestions(
      quizQuestionEntity.get('quizId')
    );
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }

    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    quizEntity.deleteQuestion(questionId);

    try {
      await this._quizRepo.updateQuiz(quizEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException(e.message);
    }
  }

  public async getQuiz(quizId: string, authUser: UserDto): Promise<QuizEntity> {
    const quizEntity = await this._quizRepo.findQuizByIdWithQuestions(quizId);
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    return quizEntity;
  }

  public async delete(quizId: string, authUser: UserDto): Promise<void> {
    const quizEntity = await this._quizRepo.findQuizById(quizId);
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    try {
      await this._quizRepo.deleteQuiz(quizId, quizEntity.get('contentId'));
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
      await this._quizParticipantRepo.create(quizParticipantEntity);
      this._eventAdapter.publish(
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
      await this._quizParticipantRepo.update(quizParticipantEntity);

      if (isFinished) {
        this._eventAdapter.publish(
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
    return this._quizRepo.getPagination({
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
    const quizEntity = await this._quizRepo.findQuizByIdWithQuestions(quizId);
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    quizEntity.setPending();
    try {
      await this._quizRepo.updateQuiz(quizEntity);
      this._eventAdapter.publish(new QuizRegenerateEvent({ quizId: quizEntity.get('id') }));
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }

    return quizEntity;
  }

  public async generateQuestions(quizId: string): Promise<void> {
    const quizEntity = await this._quizRepo.findQuizById(quizId);
    if (!quizEntity) {
      return;
    }

    if (quizEntity.isProcessing()) {
      return;
    }

    const contentEntity = await this._contentDomain.getVisibleContent(quizEntity.get('contentId'));
    const rawContent = this._contentDomain.getRawContent(contentEntity);
    if (!rawContent) {
      quizEntity.setFail({
        code: ERRORS.CONTENT_NOT_FOUND,
        message: 'Content not found',
      });
      await this._quizRepo.updateQuiz(quizEntity);
      this._eventAdapter.publish(new QuizGeneratedEvent({ quizId: quizEntity.get('id') }));
      return;
    }

    try {
      quizEntity.setProcessing();
      await this._quizRepo.updateQuiz(quizEntity);

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
        await this._quizRepo.updateQuiz(quizEntity);
        this._eventAdapter.publish(new QuizGeneratedEvent({ quizId: quizEntity.get('id') }));
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
    } catch (e) {
      let message = e.message || '';
      if (e.response?.data?.error?.message) {
        message = e.response?.data?.error?.message;
      }
      quizEntity.setFail({
        code: ERRORS.QUIZ_GENERATE_FAIL,
        message,
      });
    } finally {
      await this._quizRepo.updateQuiz(quizEntity);
      this._eventAdapter.publish(new QuizGeneratedEvent({ quizId: quizEntity.get('id') }));
    }
  }

  public async getQuizParticipant(
    quizParticipantId: string,
    authUserId: string
  ): Promise<QuizParticipantEntity> {
    const quizParticipantEntity = await this._quizParticipantRepo.getQuizParticipantById(
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
      await this._quizParticipantRepo.findQuizParticipantHighestScoreByContentIdAndUserId(
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
      await this._quizParticipantRepo.updateIsHighest(quizParticipantEntity.get('id'), true);
      this._logger.debug(
        `New highest score: ${quizParticipantId} - ${newScore} for contentId: ${contentId} and userId: ${userId}`
      );

      if (currentHighestScoreQuizParticipantEntity) {
        currentHighestScoreQuizParticipantEntity.setHighest(false);
        await this._quizParticipantRepo.updateIsHighest(
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
