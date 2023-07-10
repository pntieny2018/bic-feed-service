import { Inject, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../repositoty-interface';
import { IQuizDomainService, QuizCreateProps, QuizUpdateProps } from './interface';
import { QuizEntity } from '../model/quiz';
import { IQuizFactory, QUIZ_FACTORY_TOKEN } from '../factory/interface/quiz.factory.interface';
import { cloneDeep } from 'lodash';
import { IOpenaiService, OPEN_AI_SERVICE_TOKEN } from '@app/openai/openai.service.interface';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from './interface/content.domain-service.interface';
import { ERRORS } from '../../../../common/constants/errors';
import { EventBus } from '@nestjs/cqrs';
import { QuizCreatedEvent } from '../event/quiz-created.event';
import { QuizGeneratedEvent } from '../event/quiz-generated.event';
import { QuizRegenerateEvent } from '../event/quiz-regenerate.event';

export class QuizDomainService implements IQuizDomainService {
  private readonly _logger = new Logger(QuizDomainService.name);

  public constructor(
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository,
    @Inject(QUIZ_FACTORY_TOKEN)
    private readonly _quizFactory: IQuizFactory,
    @Inject(OPEN_AI_SERVICE_TOKEN)
    private readonly _openaiService: IOpenaiService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    private readonly event: EventBus
  ) {}

  public async create(input: QuizCreateProps): Promise<QuizEntity> {
    const quizEntity = this._quizFactory.create(input);
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

  public async update(quizEntity: QuizEntity, input: QuizUpdateProps): Promise<QuizEntity> {
    const newQuizEntity = cloneDeep(quizEntity);
    newQuizEntity.updateAttribute(input);
    try {
      await this._quizRepository.update(newQuizEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
    return newQuizEntity;
  }

  public async reGenerate(quizEntity: QuizEntity): Promise<void> {
    const cloneQuizEntity = cloneDeep(quizEntity);
    cloneQuizEntity.setPending();
    try {
      await this._quizRepository.update(cloneQuizEntity);
      this.event.publish(new QuizRegenerateEvent(quizEntity.get('id')));
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async generateQuestions(quizEntity: QuizEntity): Promise<QuizEntity> {
    const cloneQuizEntity = cloneDeep(quizEntity);
    if (cloneQuizEntity.isProcessing()) {
      cloneQuizEntity.setFail({
        code: ERRORS.QUIZ.QUIZ_PROCESSING,
        message: 'Quiz is processing',
      });
    }

    const contentEntity = await this._contentDomainService.getVisibleContent(
      cloneQuizEntity.get('contentId')
    );
    const rawContent = this._contentDomainService.getRawContent(contentEntity);
    if (!rawContent) {
      cloneQuizEntity.setFail({
        code: ERRORS.CONTENT.CONTENT_NOT_FOUND,
        message: 'Content not found',
      });
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
        message: e.message,
      });
    }

    await this._quizRepository.update(cloneQuizEntity);
    this.event.publish(new QuizGeneratedEvent(quizEntity.get('id')));
    return cloneQuizEntity;
  }
}
