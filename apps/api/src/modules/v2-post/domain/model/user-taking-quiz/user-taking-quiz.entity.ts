import { DomainModelException } from '../../../../../common/exceptions/domain-model.exception';
import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { validate as isUUID } from 'uuid';
import { Question } from '../quiz';

export type UserTakeQuizProps = {
  contentId: string;
  quizId: string;
  quizSnapshot: {
    title: string;
    description: string;
    questions: Question[];
  };
  score: string;
  timeLimit: number;
  totalQuestionsCompleted: number;
  startedAt: Date;
  finishedAt: Date;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export class UserTakingQuizEntity extends DomainAggregateRoot<UserTakeQuizProps> {
  public constructor(props: UserTakeQuizProps) {
    super(props);
  }

  public validate(): void {
    if (this._props.createdBy && !isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Created By must be UUID`);
    }

    if (this._props.updatedBy && !isUUID(this._props.updatedBy)) {
      throw new DomainModelException(`Updated By must be UUID`);
    }

    if (this._props.contentId && !isUUID(this._props.createdBy)) {
      throw new DomainModelException(`Content ID must be UUID`);
    }

    if (this._props.quizId && !isUUID(this._props.updatedBy)) {
      throw new DomainModelException(`Quiz ID must be UUID`);
    }
  }

  public isOverLimitTime(): boolean {
    return this._props.startedAt.getTime() + this._props.timeLimit > new Date().getTime();
  }
}
