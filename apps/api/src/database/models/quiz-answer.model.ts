import {
  BelongsTo,
  Column,
  CreatedAt,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { IQuizQuestion, QuizQuestionModel } from './quiz-question.model';

export interface IQuizAnswer {
  id: string;
  questionId: string;
  content: string;
  isCorrect: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  public questionId: string;

  @Column
  public content: string;

  @Column
  public isCorrect: boolean;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;

  @BelongsTo(() => QuizQuestionModel, {
    foreignKey: 'questionId',
  })
  public quizQuestion?: IQuizQuestion;
}
