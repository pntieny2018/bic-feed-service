import { QUIZ_PROCESS_STATUS, QUIZ_STATUS } from '@beincom/constants';
import { v4, validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions';
import { RULES } from '../../../constant';
import { ArticleEntity, PostEntity, SeriesEntity } from '../content';

import { QuizQuestionEntity } from './quiz-question.entity';

export type QuizAttributes = {
  id: string;
  title: string;
  contentId: string;
  status: QUIZ_STATUS;
  genStatus: QUIZ_PROCESS_STATUS;
  description: string;
  timeLimit: number;
  content?: PostEntity | SeriesEntity | ArticleEntity;
  numberOfQuestions?: number;
  numberOfAnswers?: number;
  numberOfQuestionsDisplay?: number;
  isRandom?: boolean;
  questions?: QuizQuestionEntity[];
  meta?: any;
  error?: {
    code: string;
    message: string;
  };
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
};

export class QuizEntity extends DomainAggregateRoot<QuizAttributes> {
  public constructor(props: QuizAttributes) {
    super(props);
    this.validateNumberDisplay();
  }

  public static create(options: Partial<QuizAttributes>, userId: string): QuizEntity {
    const {
      title,
      description,
      contentId,
      isRandom,
      numberOfAnswers,
      numberOfQuestions,
      numberOfQuestionsDisplay,
    } = options;
    const now = new Date();

    return new QuizEntity({
      id: v4(),
      contentId,
      title: title || null,
      description: description || null,
      numberOfQuestions,
      numberOfQuestionsDisplay: numberOfQuestionsDisplay || null,
      numberOfAnswers,
      isRandom: isRandom || true,
      timeLimit: RULES.QUIZ_TIME_LIMIT_DEFAULT,
      questions: [],
      status: QUIZ_STATUS.DRAFT,
      genStatus: QUIZ_PROCESS_STATUS.PENDING,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
  }
  public validate(): void {
    if (this._props.createdBy && !isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By must be UUID`);
    }

    if (this._props.updatedBy && !isUUID(this._props.updatedBy)) {
      throw new DomainModelException(`Updated By must be UUID`);
    }

    if (this._props.title && this._props.title.length > RULES.QUIZ_TITLE_MAX_LENGTH) {
      throw new DomainModelException(
        `Quiz title must not exceed ${RULES.QUIZ_TITLE_MAX_LENGTH} characters`
      );
    }

    if (
      this._props.description &&
      this._props.description.length > RULES.QUIZ_DESCRIPTION_MAX_LENGTH
    ) {
      throw new DomainModelException(
        `Quiz description must not exceed ${RULES.QUIZ_DESCRIPTION_MAX_LENGTH} characters`
      );
    }

    if (
      this._props.numberOfQuestions > RULES.QUIZ_MAX_QUESTION ||
      this._props.numberOfQuestions < 0
    ) {
      throw new DomainModelException(
        `Number of question must be between 0 and ${RULES.QUIZ_MAX_QUESTION}`
      );
    }

    if (this._props.numberOfAnswers > RULES.QUIZ_MAX_ANSWER || this._props.numberOfAnswers < 0) {
      throw new DomainModelException(
        `Number of answer must be between 0 and ${RULES.QUIZ_MAX_ANSWER}`
      );
    }
  }

  public validateNumberDisplay(): void {
    if (
      this._props.numberOfQuestionsDisplay !== null &&
      this._props.numberOfQuestionsDisplay > this._props.questions?.length
    ) {
      throw new DomainModelException(
        `Number of questions display cannot exceed ${this._props.questions?.length}`
      );
    }
  }

  public validateQuestions(): void {
    if (this._props.questions?.length === 0) {
      throw new DomainModelException(`Quiz must have at least one question`);
    }
    if (
      this._props.questions?.some(
        (question) => !question.get('answers') || question.get('answers').length === 0
      )
    ) {
      throw new DomainModelException(`Question must have at least one answer`);
    }

    if (
      this._props.questions?.some((question) =>
        question.get('answers').every((answer) => {
          return answer.isCorrect === false;
        })
      )
    ) {
      throw new DomainModelException(`Don't have correct answer`);
    }
    if (this._props.questions?.length > RULES.QUIZ_MAX_QUESTION) {
      throw new DomainModelException(
        `Quiz question must have <= ${RULES.QUIZ_MAX_QUESTION} questions`
      );
    }
  }

  public validatePublishing(): void {
    if (this._props.status !== QUIZ_STATUS.PUBLISHED) {
      return;
    }

    if (!this._props.title) {
      throw new DomainModelException(`Quiz title is required`);
    }
    this.validateQuestions();
    this.validateNumberDisplay();
  }

  public updateAttribute(data: Partial<QuizAttributes>): void {
    if (data.questions) {
      this._props.questions = data.questions;
    }

    if (data.title) {
      this._props.title = data.title;
    }

    if (data.description) {
      this._props.description = data.description;
    }

    if (data.numberOfQuestions) {
      this._props.numberOfQuestions = data.numberOfQuestions;
    }

    if (data.numberOfAnswers) {
      this._props.numberOfAnswers = data.numberOfAnswers;
    }

    if (data.numberOfQuestionsDisplay !== undefined) {
      this._props.numberOfQuestionsDisplay = data.numberOfQuestionsDisplay;
    }

    if (data.isRandom) {
      this._props.isRandom = data.isRandom;
    }

    if (data.status) {
      this._props.status = data.status;
    }

    if (data.meta) {
      this._props.meta = data.meta;
    }

    if (data.updatedBy) {
      this._props.updatedBy = data.updatedBy;
    }

    this._props.updatedAt = new Date();
    this.validatePublishing();
  }

  public setProcessed(): void {
    this._props.genStatus = QUIZ_PROCESS_STATUS.PROCESSED;
  }

  public isOwner(userId: string): boolean {
    return this._props.createdBy === userId;
  }

  public isVisible(userId: string): boolean {
    return this._props.status === QUIZ_STATUS.PUBLISHED || this.isOwner(userId);
  }

  public setFail(error: { code: string; message: string }): void {
    this._props.error = error;
    this._props.genStatus = QUIZ_PROCESS_STATUS.FAILED;
  }

  public setProcessing(): void {
    this._props.genStatus = QUIZ_PROCESS_STATUS.PROCESSING;
  }

  public setPending(): void {
    this._props.genStatus = QUIZ_PROCESS_STATUS.PENDING;
  }

  public isPending(): boolean {
    return this._props.genStatus === QUIZ_PROCESS_STATUS.PENDING;
  }

  public isProcessing(): boolean {
    return this._props.genStatus === QUIZ_PROCESS_STATUS.PROCESSING;
  }

  public isPublished(): boolean {
    return this._props.status === QUIZ_STATUS.PUBLISHED;
  }

  public isRandomQuestion(): boolean {
    return this._props.isRandom;
  }

  public deleteQuestion(idQuestion: string): void {
    this._props.questions = this._props.questions.filter(
      (question) => question.get('id') !== idQuestion
    );

    if (this._props.numberOfQuestionsDisplay > this._props.questions.length) {
      this._props.numberOfQuestionsDisplay = this._props.questions.length;
    }
    if (this._props.questions.length === 0) {
      throw new DomainModelException(`Quiz must have at least one question`);
    }
  }
}
