import { BelongsTo, Column, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { QuizModel } from './quiz.model';
import { IQuizQuestion, QuizQuestionModel } from './quiz-question.model';

export interface IQuizAnswer {
  id: string;
  quizId: string;
  questionId: string;
  content: string;
  isCorrect: boolean;
}
@Table({
  tableName: 'quiz_answers',
  timestamps: false,
})
export class QuizAnswerModel
  extends Model<IQuizAnswer, Optional<IQuizAnswer, 'id'>>
  implements IQuizAnswer
{
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public quizId: string;

  @Column
  public questionId: string;

  @Column
  public content: string;

  @Column
  public isCorrect: boolean;

  @BelongsTo(() => QuizQuestionModel, {
    foreignKey: 'questionId',
  })
  public quizQuestion?: IQuizQuestion;
}
