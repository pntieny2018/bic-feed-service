import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { Question } from '../quiz';
import { v4 } from 'uuid';
import { RULES } from '../../../constant';

export type QuizParticipantProps = {
  id: string;
  contentId: string;
  quizId: string;
  quizSnapshot: {
    title: string;
    description: string;
    questions: Question[];
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

  public isOverLimitTime(): boolean {
    return (
      this._props.startedAt.getTime() +
        (this._props.timeLimit + RULES.QUIZ_TIME_LIMIT_BUFFER) * 1000 <
      new Date().getTime()
    );
  }

  public isFinished(): boolean {
    return !!this._props.finishedAt;
  }

  public isOwner(userId: string): boolean {
    return this._props.createdBy === userId;
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

    console.log('correctAnswers=', correctAnswers);
    this._props.answers = answers.map((answer) => ({
      id: answer?.id || v4(),
      questionId: answer.questionId,
      answerId: answer.answerId,
      isCorrect: correctAnswers.get(answer.questionId) === answer.answerId,
      createdAt: answer?.id ? undefined : now,
      updatedAt: now,
    }));

    const totalCorrectAnswers = this._props.answers.filter((answer) => answer.isCorrect).length;
    this._props.score = (totalCorrectAnswers / this._props.quizSnapshot.questions.length) * 100;
    this._props.totalAnswers = answers.length;
    this._props.totalCorrectAnswers = totalCorrectAnswers;
    console.log('this._props=', this._props);
  }

  public setFinishedAt(): void {
    this._props.finishedAt = new Date();
  }
}
