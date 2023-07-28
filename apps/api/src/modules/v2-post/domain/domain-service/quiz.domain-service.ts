import { cloneDeep } from 'lodash';
import { QuizEntity } from '../model/quiz';
import { Inject, Logger } from '@nestjs/common';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../repositoty-interface';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  GetQuizzesProps,
  IContentDomainService,
  IQuizDomainService,
  QuizCreateProps,
  QuizUpdateProps,
} from './interface';
import { IQuizFactory, QUIZ_FACTORY_TOKEN } from '../factory/interface/quiz.factory.interface';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { IOpenaiService, OPEN_AI_SERVICE_TOKEN } from '@app/openai/openai.service.interface';
import { ERRORS } from '../../../../common/constants/errors';
import { EventBus } from '@nestjs/cqrs';
import { QuizCreatedEvent } from '../event/quiz-created.event';
import { QuizGeneratedEvent } from '../event/quiz-generated.event';
import { QuizRegenerateEvent } from '../event/quiz-regenerate.event';
import { ContentHasQuizException, QuizNotFoundException } from '../exception';
import { IQuizValidator, QUIZ_VALIDATOR_TOKEN } from '../validator/interface';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';
import { UserDto } from '../../../v2-user/application';
import { QuizParticipantEntity } from '../model/quiz-participant';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../repositoty-interface/quiz-participant.repository.interface';

export class QuizDomainService implements IQuizDomainService {
  private readonly _logger = new Logger(QuizDomainService.name);
  public constructor(
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository,
    @Inject(QUIZ_FACTORY_TOKEN)
    private readonly _quizFactory: IQuizFactory,
    @Inject(OPEN_AI_SERVICE_TOKEN)
    private readonly _openaiService: IOpenaiService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(QUIZ_VALIDATOR_TOKEN)
    private readonly _quizValidator: IQuizValidator,
    private readonly event: EventBus
  ) {}

  public async create(input: QuizCreateProps): Promise<QuizEntity> {
    const { authUser, contentId } = input;

    await this._quizValidator.checkCanCUDQuizInContent(contentId, authUser);

    const quizEntitiesInContent = await this._quizRepository.findAll({
      where: {
        contentId,
      },
    });
    if (quizEntitiesInContent.length > 0) {
      throw new ContentHasQuizException();
    }

    const quizEntity = this._quizFactory.createQuiz(input);
    try {
      await this._quizRepository.create(quizEntity);
      quizEntity.commit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    this.event.publish(new QuizCreatedEvent(quizEntity.get('id')));
    return quizEntity;
  }

  public async update(input: QuizUpdateProps): Promise<QuizEntity> {
    const { authUser, quizId } = input;

    const quizEntity = await this._quizRepository.findOne({
      where: {
        id: quizId,
      },
    });
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }

    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    quizEntity.updateAttribute(input);
    try {
      await this._quizRepository.update(quizEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return quizEntity;
  }

  public async getQuiz(quizId: string, authUser: UserDto): Promise<QuizEntity> {
    const quizEntity = await this._quizRepository.findOne({
      where: {
        id: quizId,
      },
    });
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    return quizEntity;
  }

  public async delete(quizId: string, authUser: UserDto): Promise<void> {
    const quizEntity = await this._quizRepository.findOne({
      where: {
        id: quizId,
      },
    });
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    try {
      await this._quizRepository.delete(quizId);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async startQuiz(
    quizEntity: QuizEntity,
    authUser: UserDto
  ): Promise<QuizParticipantEntity> {
    const quizParticipant = this._quizFactory.createTakeQuiz(authUser.id, quizEntity);
    try {
      await this._quizParticipantRepository.create(quizParticipant);
    } catch (e) {
      console.log(e);
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }

    return quizParticipant;
  }

  public async getQuizzes(input: GetQuizzesProps): Promise<CursorPaginationResult<QuizEntity>> {
    const { authUser, type, status } = input;
    return this._quizRepository.getPagination({
      ...input,
      where: {
        createdBy: authUser.id,
        status,
      },
      contentType: type,
      attributes: ['id', 'createdAt'],
    });
  }

  public async reGenerate(quizId: string, authUser: UserDto): Promise<QuizEntity> {
    const quizEntity = await this._quizRepository.findOne({ where: { id: quizId } });
    if (!quizEntity) {
      throw new QuizNotFoundException();
    }
    await this._quizValidator.checkCanCUDQuizInContent(quizEntity.get('contentId'), authUser);

    quizEntity.setPending();
    try {
      await this._quizRepository.update(quizEntity);
      this.event.publish(new QuizRegenerateEvent(quizEntity.get('id')));
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }

    return quizEntity;
  }

  public async generateQuestions(quizEntity: QuizEntity): Promise<void> {
    const cloneQuizEntity = cloneDeep(quizEntity);
    if (cloneQuizEntity.isProcessing()) return;

    const contentEntity = await this._contentDomainService.getVisibleContent(
      cloneQuizEntity.get('contentId')
    );
    const rawContent = this._contentDomainService.getRawContent(contentEntity);
    if (!rawContent) {
      cloneQuizEntity.setFail({
        code: ERRORS.CONTENT.CONTENT_NOT_FOUND,
        message: 'Content not found',
      });
      await this._quizRepository.update(cloneQuizEntity);
      this.event.publish(new QuizGeneratedEvent(quizEntity.get('id')));
      return;
    }

    try {
      cloneQuizEntity.setProcessing();
      await this._quizRepository.update(cloneQuizEntity);

      const { questions, usage, model, maxTokens, completion } =
        await this._openaiService.generateQuestion({
          content: rawContent,
          numberOfQuestions: cloneQuizEntity.get('numberOfQuestions'),
          numberOfAnswers: cloneQuizEntity.get('numberOfAnswers'),
        });
      if (questions?.length === 0) {
        cloneQuizEntity.setFail({
          code: ERRORS.QUIZ.GENERATE_FAIL,
          message: 'No questions generated',
        });
        await this._quizRepository.update(cloneQuizEntity);
        this.event.publish(new QuizGeneratedEvent(quizEntity.get('id')));
        return;
      }

      cloneQuizEntity.setProcessed();
      cloneQuizEntity.updateAttribute({
        questions,
        meta: {
          usage,
          model,
          maxTokens,
          completion,
        },
      });
    } catch (e) {
      cloneQuizEntity.setFail({
        code: ERRORS.QUIZ.GENERATE_FAIL,
        message: e.response.data?.error?.message || '',
      });
      /*await this._quizRepository.update(cloneQuizEntity);
      if (e.response?.status === 429) {
        throw new QuizGenerationLimitException();
      }*/
    }
    await this._quizRepository.update(cloneQuizEntity);
    this.event.publish(new QuizGeneratedEvent(quizEntity.get('id')));
  }
}
