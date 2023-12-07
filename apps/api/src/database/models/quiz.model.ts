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
import { DataTypes, Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { PostModel } from './post.model';
import { IQuizQuestion, QuizQuestionModel } from './quiz-question.model';
import { QUIZ_PROCESS_STATUS, QUIZ_STATUS } from '@beincom/constants';

export interface IQuiz {
  id: string;
  title: string;
  description: string;
  postId: string;
  status: QUIZ_STATUS;
  genStatus: QUIZ_PROCESS_STATUS;
  timeLimit: number;
  numberOfQuestions: number;
  numberOfAnswers: number;
  numberOfQuestionsDisplay: number;
  isRandom: boolean;
  questions: IQuizQuestion[];
  meta: any;
  error: any;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  tableName: 'quizzes',
})
export class QuizModel extends Model<IQuiz, Optional<IQuiz, 'id'>> implements IQuiz {
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
  public isRandom: boolean;

  @Column({
    type: DataTypes.JSONB,
  })
  public meta: any;

  @Column({
    type: DataTypes.STRING,
  })
  public status: QUIZ_STATUS;

  @Column({
    type: DataTypes.STRING,
  })
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
  public questions: IQuizQuestion[];
}
