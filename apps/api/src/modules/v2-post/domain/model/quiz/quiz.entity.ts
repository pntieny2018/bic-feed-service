import { RULES } from '../../../constant';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { ArticleEntity, PostEntity, SeriesEntity } from '../content';
import { QuizGenStatus, QuizStatus } from '../../../data-type';

export type QuestionAttributes = {
  id: string;
  content: string;
  answers: {
    id: string;
    content: string;
    isCorrect: boolean;
  }[];
};

export type QuizAttributes = {
  id: string;
  title: string;
  contentId: string;
  status: QuizStatus;
  genStatus: QuizGenStatus;
  description: string;
  timeLimit: number;
  content?: PostEntity | SeriesEntity | ArticleEntity;
  numberOfQuestions?: number;
  numberOfAnswers?: number;
  numberOfQuestionsDisplay?: number;
  numberOfAnswersDisplay?: number;
  isRandom?: boolean;
  questions?: QuestionAttributes[];
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
    if (this._props.numberOfQuestions < this._props.numberOfQuestionsDisplay) {
      throw new DomainModelException(
        `Number of questions display cannot exceed ${this._props.numberOfQuestions}`
      );
    }

    if (this._props.numberOfAnswers < this._props.numberOfAnswersDisplay) {
      throw new DomainModelException(
        `Number of answers display cannot exceed ${this._props.numberOfQuestions}`
      );
    }
  }

  public validatePublishing(): void {
    if (this._props.status !== QuizStatus.PUBLISHED) return;

    if (!this._props.title) {
      throw new DomainModelException(`Quiz title is required`);
    }

    if (this._props.questions.length === 0) {
      throw new DomainModelException(`Quiz must have at least one question`);
    }

    if (this._props.questions.length === 0) {
      throw new DomainModelException(`Quiz must have at least one question`);
    }

    if (
      this._props.questions.some((question) => !question.answers || question.answers.length === 0)
    ) {
      throw new DomainModelException(`Question must have at least one answer`);
    }

    if (
      this._props.questions.some((question) =>
        question.answers.every((answer) => {
          return answer.isCorrect === false;
        })
      )
    ) {
      throw new DomainModelException(`Dont have correct answer`);
    }
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

    if (data.numberOfQuestionsDisplay) {
      this._props.numberOfQuestionsDisplay = data.numberOfQuestionsDisplay;
    }

    if (data.numberOfAnswersDisplay) {
      this._props.numberOfAnswersDisplay = data.numberOfAnswersDisplay;
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
    this._props.genStatus = QuizGenStatus.PROCESSED;
  }

  public isOwner(userId: string): boolean {
    return this._props.createdBy === userId;
  }

  public isVisible(userId: string): boolean {
    return this._props.status === QuizStatus.PUBLISHED || this.isOwner(userId);
  }
  public setFail(error: { code: string; message: string }): void {
    this._props.error = error;
    this._props.genStatus = QuizGenStatus.FAILED;
  }

  public setProcessing(): void {
    this._props.genStatus = QuizGenStatus.PROCESSING;
  }

  public setPending(): void {
    this._props.genStatus = QuizGenStatus.PENDING;
  }

  public isPending(): boolean {
    return this._props.genStatus === QuizGenStatus.PENDING;
  }

  public isProcessing(): boolean {
    return this._props.genStatus === QuizGenStatus.PROCESSING;
  }

  public isPublished(): boolean {
    return this._props.status === QuizStatus.PUBLISHED;
  }

  public isGenerateFailed(): boolean {
    return this._props.genStatus === QuizGenStatus.FAILED;
  }

  public isGenerateProcessed(): boolean {
    return this._props.genStatus === QuizGenStatus.PROCESSED;
  }
}
