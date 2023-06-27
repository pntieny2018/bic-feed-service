import { RULES } from '../../../constant';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { QuizStatus } from '../../../data-type/quiz-status.enum';

export type Question = {
  question: string;
  answers: {
    answer: string;
    isCorrect: boolean;
  }[];
};
export type QuizProps = {
  id: string;
  title: string;
  contentId: string;
  status: QuizStatus;
  description: string;
  numberOfQuestions: number;
  numberOfAnswers: number;
  numberOfQuestionsDisplay: number;
  numberOfAnswersDisplay: number;
  isRandom: boolean;
  questions: Question[];
  meta: any;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export class QuizEntity extends DomainAggregateRoot<QuizProps> {
  public constructor(props: QuizProps) {
    super(props);
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

    if (
      this._props.numberOfAnswersDisplay &&
      this._props.numberOfAnswersDisplay > this._props.numberOfAnswers
    ) {
      throw new DomainModelException(
        `Number of answer display cannot exceed ${this._props.numberOfAnswers}`
      );
    }

    if (
      this._props.numberOfQuestionsDisplay &&
      this._props.numberOfQuestionsDisplay > this._props.numberOfQuestions
    ) {
      throw new DomainModelException(
        `Number of question display cannot exceed ${this._props.numberOfQuestions}`
      );
    }
  }
}
