import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { DataTypes, Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { IPost, PostModel } from './post.model';
import { IQuiz, QuizModel } from './quiz.model';

export interface IUserTakeQuiz {
  id: string;
  quizId: string;
  contentId: string;
  timeLimit: number;
  score: number;
  totalQuestionsCompleted: number;
  startedAt: Date;
  finishedAt: Date;
  quizSnapshot: Pick<IQuiz, 'title' | 'description' | 'questions'>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  post?: IPost;
  quiz?: IQuiz;
}

@Table({
  tableName: 'users_take_quizzes',
})
export class UserTakeQuizModel
  extends Model<IUserTakeQuiz, Optional<IUserTakeQuiz, 'id'>>
  implements IUserTakeQuiz
{
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public quizId: string;

  @Column
  public contentId: string;

  @Column
  public score: number;

  @Column
  public timeLimit: number;

  @Column
  public totalQuestionsCompleted: number;

  @Column
  public startedAt: Date;

  @Column
  public finishedAt: Date;

  @BelongsTo(() => PostModel, {
    foreignKey: 'contentId',
  })
  public post?: PostModel;

  @BelongsTo(() => QuizModel, {
    foreignKey: 'quizId',
  })
  public quiz?: IQuiz;

  @Column({
    type: DataTypes.JSONB,
  })
  public quizSnapshot: any;

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
