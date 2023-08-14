import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { v4 } from 'uuid';
import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { RULES } from '../../../constant';

export type QuizQuestionAttributes = {
  id: string;
  quizId: string;
  content: string;
  answers: {
    id?: string;
    content: string;
    isCorrect: boolean;
    updatedAt?: Date;
    createdAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

export class QuizQuestionEntity extends DomainAggregateRoot<QuizQuestionAttributes> {
  public constructor(props: QuizQuestionAttributes) {
    super(props);
  }

  public validate(): void {
    //
  }

  public validateAnswers(): void {
    if (this._props.answers?.length === 0) {
      throw new DomainModelException('Quiz question must have at least one answer');
    }

    if (this._props.answers.every((answer) => !answer.isCorrect)) {
      throw new DomainModelException('Quiz question must have at least one correct answer');
    }

    if (this._props.answers.filter((answer) => answer.isCorrect).length > 1) {
      throw new DomainModelException('Quiz question must have only one correct answer');
    }

    if (this._props.answers?.length > RULES.QUIZ_MAX_ANSWER) {
      throw new DomainModelException(`Quiz question must have <= ${RULES.QUIZ_MAX_ANSWER} answers`);
    }
  }
  public updateAttribute(data: Partial<QuizQuestionAttributes>): void {
    if (data.content) {
      this._props.content = data.content;
    }

    if (data.answers) {
      this._props.answers = data.answers.map((answer) => ({
        id: answer.id || v4(),
        content: answer.content,
        isCorrect: answer.isCorrect,
        updatedAt: new Date(),
      }));
    }
  }
}
