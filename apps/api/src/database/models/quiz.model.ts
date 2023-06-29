import {
  AllowNull,
  Column,
  CreatedAt,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
  BelongsTo,
} from 'sequelize-typescript';
import { DataTypes, Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { QuizStatus } from '../../modules/v2-post/data-type/quiz-status.enum';
import { PostModel } from './post.model';

export interface IQuiz {
  id: string;
  title: string;
  description: string;
  contentId: string;
  status: QuizStatus;
  numberOfQuestions: number;
  numberOfAnswers: number;
  numberOfQuestionsDisplay: number;
  numberOfAnswersDisplay: number;
  isRandom: boolean;
  questions: {
    question: string;
    answers: {
      answer: string;
      isCorrect: boolean;
    }[];
  }[];
  meta: any;
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
  public contentId: string;

  @BelongsTo(() => PostModel, 'contentId')
  public post?: PostModel;

  @Column
  public title: string;

  @Column
  public description: string;

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
  public questions: any;

  @Column({
    type: DataTypes.JSONB,
  })
  public meta: any;

  @Column
  public status: QuizStatus;

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
}
