import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  BelongsTo,
  Column,
  CreatedAt,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { QuizAnswerAttributes, QuizAnswerModel } from './quiz-answer.model';
import { QuizAttributes, QuizModel } from './quiz.model';

export type QuizQuestionAttributes = InferAttributes<QuizQuestionModel>;
@Table({
  tableName: 'quiz_questions',
  timestamps: false,
})
export class QuizQuestionModel extends Model<
  QuizQuestionAttributes,
  InferCreationAttributes<QuizQuestionModel>
> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public quizId: string;

  @Column
  public content: string;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;

  @HasMany(() => QuizAnswerModel, {
    foreignKey: 'questionId',
  })
  public answers: QuizAnswerAttributes[];

  @BelongsTo(() => QuizModel, {
    foreignKey: 'quizId',
  })
  public quiz?: QuizAttributes;
}
