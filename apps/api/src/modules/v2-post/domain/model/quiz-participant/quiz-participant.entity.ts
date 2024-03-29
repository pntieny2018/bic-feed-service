import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { v4 } from 'uuid';
import { RULES } from '../../../constant';
import { ArrayHelper } from '../../../../../common/helpers';

type QuestionAttribute = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  answers: {
    id: string;
    content: string;
    isCorrect: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
};
export type QuizParticipantProps = {
  id: string;
  contentId: string;
  quizId: string;
  quizSnapshot: {
    title: string;
    description: string;
    questions: QuestionAttribute[];
  };
  answers: {
    id: string;
    questionId: string;
    answerId: string;
    isCorrect: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
  score: number;
  isHighest: boolean;
  timeLimit: number;
  totalAnswers: number;
  totalCorrectAnswers: number;
  startedAt: Date;
  finishedAt: Date;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export class QuizParticipantEntity extends DomainAggregateRoot<QuizParticipantProps> {
  public constructor(props: QuizParticipantProps) {
    super(props);
  }

  public validate(): void {
    //
  }

  public isOverTimeLimit(): boolean {
    return (
      this._props.startedAt.getTime() +
        (this._props.timeLimit + RULES.QUIZ_TIME_LIMIT_BUFFER) * 1000 <
      new Date().getTime()
    );
  }

  public isFinished(): boolean {
    return !!this._props.finishedAt;
  }

  public isFinishedOrOverTimeLimit(): boolean {
    return this.isFinished() || this.isOverTimeLimit();
  }

  public isOwner(userId: string): boolean {
    return this._props.createdBy === userId;
  }

  public isHighest(): boolean {
    return this._props.isHighest;
  }

  public getCorrectAnswersFromSnapshot(): Map<string, string> {
    const correctAnswers = new Map<string, string>();
    this._props.quizSnapshot.questions.forEach((question) => {
      const answer = question.answers.find((answer) => answer.isCorrect);
      correctAnswers.set(question.id, answer.id);
    });
    return correctAnswers;
  }
  public updateAnswers(
    answers: {
      id?: string;
      questionId: string;
      answerId: string;
    }[]
  ): void {
    const now = new Date();
    const correctAnswers = this.getCorrectAnswersFromSnapshot();
    this._props.answers = answers.map((answer) => ({
      id: answer?.id || v4(),
      questionId: answer.questionId,
      answerId: answer.answerId,
      isCorrect: correctAnswers.get(answer.questionId) === answer.answerId,
      createdAt: answer?.id ? undefined : now,
      updatedAt: now,
    }));

    const totalCorrectAnswers = this._props.answers.filter((answer) => answer.isCorrect).length;
    this._props.score = Math.round(
      (totalCorrectAnswers / this._props.quizSnapshot.questions.length) * 100
    );
    this._props.totalAnswers = answers.length;
    this._props.totalCorrectAnswers = totalCorrectAnswers;
  }

  public setFinishedAt(time: Date = new Date()): void {
    this._props.finishedAt = time;
  }

  public hideResult(): void {
    this._props.score = undefined;
    this._props.totalAnswers = undefined;
    this._props.totalCorrectAnswers = undefined;
    this._props.finishedAt = undefined;
  }

  public shuffleQuestions(): void {
    this._props.quizSnapshot.questions = ArrayHelper.shuffle(this._props.quizSnapshot.questions);
  }

  public setHighest(isHighest: boolean): void {
    this._props.isHighest = isHighest;
  }
}
