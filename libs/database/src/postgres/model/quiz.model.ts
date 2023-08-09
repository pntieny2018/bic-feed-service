import { QUIZ_PROCESS_STATUS, QUIZ_STATUS } from '@beincom/constants';
import { IsUUID } from 'class-validator';
import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  AllowNull,
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

import { PostModel } from './post.model';
import { QuizQuestionModel } from './quiz-question.model';

export type QuizAttributes = InferAttributes<QuizModel>;
@Table({
  tableName: 'quizzes',
})
export class QuizModel extends Model<QuizAttributes, InferCreationAttributes<QuizModel>> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public postId: string;

  @BelongsTo(() => PostModel, {
    foreignKey: 'postId',
  })
  public post?: PostModel;

  @Column
  public title: string;

  @Column
  public description: string;

  @Column
  public timeLimit: number;

  @Column
  public numberOfQuestions: number;

  @Column
  public numberOfAnswers: number;

  @Column
  public numberOfQuestionsDisplay: number;

  @Column
  public numberOfAnswersDisplay: number;

  @Column
  public isRandom: boolean;

  @Column({
    type: DataTypes.JSONB,
  })
  public meta: any;

  @Column
  public status: QUIZ_STATUS;

  @Column
  public genStatus: QUIZ_PROCESS_STATUS;

  @Column({
    type: DataTypes.JSONB,
  })
  public error: any;

  @AllowNull(false)
  @Column
  public createdBy: string;

  @AllowNull(false)
  @Column
  public updatedBy: string;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;

  @HasMany(() => QuizQuestionModel, {
    foreignKey: 'quizId',
  })
  public questions: QuizQuestionModel[];
}
