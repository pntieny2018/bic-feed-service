import {
  BelongsTo,
  Column,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { IQuizAnswer, QuizAnswerModel } from './quiz-answer.model';
import { IQuiz, QuizModel } from './quiz.model';

export interface IQuizQuestion {
  id: string;
  quizId: string;
  content: string;
  answers: IQuizAnswer[];
  quiz?: IQuiz;
}
@Table({
  tableName: 'quiz_questions',
  timestamps: false,
})
export class QuizQuestionModel
  extends Model<IQuizQuestion, Optional<IQuizQuestion, 'id'>>
  implements IQuizQuestion
{
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public quizId: string;

  @Column
  public content: string;

  @HasMany(() => QuizAnswerModel, {
    foreignKey: 'questionId',
  })
  public answers: IQuizAnswer[];

  @BelongsTo(() => QuizModel, {
    foreignKey: 'quizId',
  })
  public quiz?: QuizModel;
}
