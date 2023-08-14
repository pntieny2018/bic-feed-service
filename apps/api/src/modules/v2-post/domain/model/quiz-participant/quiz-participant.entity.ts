import { v4 } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { RULES } from '../../../constant';
import { QuestionAttributes, QuizEntity } from '../quiz';

export type QuizParticipantAttributes = {
  id: string;
  contentId: string;
  quizId: string;
  quizSnapshot: {
    title: string;
    description: string;
    questions: QuestionAttributes[];
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

export class QuizParticipantEntity extends DomainAggregateRoot<QuizParticipantAttributes> {
  public constructor(props: QuizParticipantAttributes) {
    super(props);
  }

  public static create(userId: string, quizEntity: QuizEntity): QuizParticipantEntity {
    const now = new Date();
    return new QuizParticipantEntity({
      id: v4(),
      quizId: quizEntity.get('id'),
      contentId: quizEntity.get('contentId'),
      quizSnapshot: {
        title: quizEntity.get('title'),
        description: quizEntity.get('description'),
        questions: quizEntity.get('questions'),
      },
      score: 0,
      timeLimit: quizEntity.get('timeLimit'),
      answers: [],
      totalAnswers: 0,
      totalCorrectAnswers: 0,
      startedAt: now,
      finishedAt: null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    });
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
  }

  public setFinishedAt(): void {
    this._props.finishedAt = new Date();
  }
}
