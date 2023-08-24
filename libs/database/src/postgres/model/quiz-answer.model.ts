import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { BelongsTo, Column, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { QuizQuestionModel } from './quiz-question.model';

export type QuizAnswerAttributes = InferAttributes<QuizAnswerModel>;
@Table({
  tableName: 'quiz_answers',
  timestamps: false,
})
export class QuizAnswerModel extends Model<
  QuizAnswerAttributes,
  InferCreationAttributes<QuizAnswerModel>
> {
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
  public quizQuestion?: QuizQuestionModel;
}