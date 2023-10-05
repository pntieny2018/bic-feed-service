import { v4 } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { ArrayHelper } from '../../../../../common/helpers';
import { RULES } from '../../../constant';
import { QuizQuestionAttributes } from '../quiz/quiz-question.entity';
import { QuizEntity } from '../quiz/quiz.entity';

export type QuizParticipantProps = {
  id: string;
  contentId: string;
  quizId: string;
  quizSnapshot: {
    title: string;
    description: string;
    questions: QuizQuestionAttributes[];
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

  public static create(props: QuizParticipantProps): QuizParticipantEntity {
    return new QuizParticipantEntity({
      id: v4(),
      ...props,
    });
  }

  public static createFromQuiz(quizEntity: QuizEntity, userId: string): QuizParticipantEntity {
    const now = new Date();
    return new QuizParticipantEntity({
      id: v4(),
      quizId: quizEntity.get('id'),
      contentId: quizEntity.get('contentId'),
      quizSnapshot: {
        title: quizEntity.get('title'),
        description: quizEntity.get('description'),
        questions: quizEntity.get('questions').map((question) => ({
          id: question.get('id'),
          content: question.get('content'),
          createdAt: question.get('createdAt'),
          updatedAt: question.get('updatedAt'),
          answers: question.get('answers').map((answer) => ({
            id: answer.id,
            content: answer.content,
            isCorrect: answer.isCorrect,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
          })),
        })),
      },
      answers: [],
      score: 0,
      isHighest: false,
      timeLimit: quizEntity.get('timeLimit'),
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

  public filterQuestionDisplay(questionDisplay: number): void {
    if (questionDisplay) {
      this._props.quizSnapshot.questions = this._props.quizSnapshot.questions.slice(
        0,
        questionDisplay
      );
    }
  }

  public setHighest(isHighest: boolean): void {
    this._props.isHighest = isHighest;
  }
}
