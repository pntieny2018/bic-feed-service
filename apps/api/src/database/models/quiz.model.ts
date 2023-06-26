import {
  AllowNull,
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

export interface IQuiz {
  id: string;
  title: string;
  description: string;
  numQuestion: number;
  numAnswer: number;
  numQuestionDisplay: number;
  numAnswerDisplay: number;
  isRandom: boolean;
  questions: string;
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
  public title: string;

  @Column
  public description: string;

  @Column
  public numQuestion: number;

  @Column
  public numAnswer: number;

  @Column
  public numQuestionDisplay: number;

  @Column
  public numAnswerDisplay: number;

  @Column
  public isRandom: boolean;

  @Column
  public questions: any;

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
