import {
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

export interface IUserTakeQuizDetail {
  id: string;
  userTakeQuizId: string;
  quizId: string;
  questionId: string;
  answerId: string;
  isCorrect: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  tableName: 'user_take_quiz_detail',
})
export class UserTakeQuizDetailModel
  extends Model<IUserTakeQuizDetail, Optional<IUserTakeQuizDetail, 'id'>>
  implements IUserTakeQuizDetail
{
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public userTakeQuizId: string;

  @Column
  public quizId: string;

  @Column
  public questionId: string;

  @Column
  public answerId: string;

  @Column
  public isCorrect: boolean;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;
}
